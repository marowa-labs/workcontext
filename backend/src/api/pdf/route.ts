import { Request, Response } from "express";
import { PdfService } from "../../services/pdfService";
import { VectorStoreService } from "../../services/vectorStoreService";
import { getSupabaseAdminClient } from "../../lib/supabase/client";
// @ts-ignore
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
// @ts-ignore
import { Document } from "langchain/document";

import { v4 as uuidv4 } from "uuid";
import { SecretsService } from "../../services/secrets-service";
import { prisma } from "../../lib/prisma";
import { PaperRecommendationService } from "../../services/paperRecommendationService";

// POST /api/pdf/upload
export async function UPLOAD_PDF(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, buffer } = file;
    console.log("1. Extracting text from PDF...");
    const text = await PdfService.extractText(buffer);

    // 1. Store file metadata in DB using admin client (bypasses RLS)
    console.log("3. Getting admin client...");
    const client = await getSupabaseAdminClient();
    if (!client) {
      console.error("Admin client is null!");
      return res
        .status(500)
        .json({ error: "Database admin client not configured" });
    }
    console.log("4. Admin client obtained");

    let userId = (req as any).user?.id;

    if (!userId) {
      console.log(
        "User ID missing from request, fetching a valid user for testing...",
      );
      // Fetch the first user from the database using Prisma
      const fallbackUser = await prisma.user.findFirst({
        select: { id: true },
      });
      if (fallbackUser) {
        userId = fallbackUser.id;
        console.log("Using fallback user ID:", userId);
      } else {
        console.error("No users found in database to use as fallback");
        return res
          .status(500)
          .json({ error: "No valid user found for upload" });
      }
    }
    console.log("2. Final User ID:", userId);

    const docId = uuidv4(); // Generate UUID explicitly
    console.log("5. Uploading file to storage...");

    // Ensure bucket exists
    try {
      const { data: buckets } = await client.storage.listBuckets();
      if (!buckets?.find((b: any) => b.name === "uploads")) {
        console.log("Creating 'uploads' bucket...");
        const { error: createBucketError } = await client.storage.createBucket(
          "uploads",
          {
            public: false,
            fileSizeLimit: 10485760, // 10MB limit (optional)
          },
        );
        if (createBucketError) {
          console.error("Failed to create bucket:", createBucketError);
        }
      }
    } catch (bucketCheckError) {
      console.error("Error checking buckets:", bucketCheckError);
    }

    // Upload to Supabase Storage
    // Path: {userId}/{docId}.pdf
    const storagePath = `${userId}/${docId}.pdf`;
    const { error: uploadError } = await client.storage
      .from("uploads")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Determine if it's a "Bucket not found" error and try to create it?
      // For now just throw
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    console.log("6. Inserting PDF metadata using Prisma...");
    const now = new Date();

    const doc = await prisma.pdfDocument.create({
      data: {
        id: docId,
        filename: originalname,
        user_id: userId,
        status: "processing",
        created_at: now,
        updated_at: now,
      },
    });

    const documentId = doc.id;

    // 2. Vectorize
    const chunks = await PdfService.chunkText(text, {
      documentId: documentId,
      filename: originalname,
      userId: userId,
    });

    await VectorStoreService.storeDocuments(chunks);

    // 3. Update status using Prisma
    await prisma.pdfDocument.update({
      where: { id: documentId },
      data: { status: "ready", updated_at: new Date() },
    });

    res.json({ documentId, message: "PDF processed successfully" });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/pdf/chat
export async function CHAT_PDF(req: Request, res: Response) {
  try {
    const { documentId, message } = req.body;
    if (!documentId || !message) {
      return res.status(400).json({ error: "Missing documentId or message" });
    }

    // 1. Retrieve context
    const docs = await VectorStoreService.search(message, { documentId });

    if (docs.length === 0) {
      // Create a response using just the model knowledge if no context found,
      // OR explicit "I don't know".
      // Let's try to answer generally but warn? Or just say no info.
      // Better: "I couldn't find relevant information in the uploaded document."
      // But let's let the LLM decide if we pass empty context?
      // No, let's keep it strict RAG for now.
    }

    // 2. Generate Answer
    const apiKey = await SecretsService.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-4o",
      openAIApiKey: apiKey,
    });

    // Manual RAG: Join content and prompt
    const context =
      docs.length > 0 ? docs.map((d) => d.pageContent).join("\n\n") : "";

    let systemPrompt;
    if (context) {
      systemPrompt = `You are a helpful AI research assistant. Use the following context from an uploaded PDF to answer the user's question. 
If the answer is not in the context, say so, but you may offer general knowledge if explicitly asked.
Cite the context where possible.

Context:
${context}`;
    } else {
      // Fallback if no context found but we still want to chat?
      // Or just fail. Let's return the "no info" message from before if strict.
      // Actually, the previous code returned JSON immediately. Let's stick to that for now if strict.
      if (docs.length === 0) {
        return res.json({
          answer:
            "I checked the document but couldn't find any relevant information to answer your question.",
          sources: [],
        });
      }
    }

    // @ts-ignore
    const response = await model.invoke([
      new SystemMessage(systemPrompt || ""),
      new HumanMessage(message),
    ]);

    // content field in response
    const answer =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    res.json({ answer, sources: docs.map((d) => d.pageContent) });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/pdf
export async function GET_PDFS(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pdfs = await prisma.pdfDocument.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    res.json(pdfs);
  } catch (error: any) {
    console.error("Get PDFs error:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/pdf/:id
export async function GET_PDF(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const pdf = await prisma.pdfDocument.findUnique({
      where: { id },
    });

    if (!pdf) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(pdf);
  } catch (error: any) {
    console.error("Get PDF error:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/pdf/:id/download
export async function GET_PDF_DOWNLOAD(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify ownership
    const pdf = await prisma.pdfDocument.findFirst({
      where: { id, user_id: userId },
    });

    if (!pdf) {
      return res
        .status(404)
        .json({ error: "Document not found or access denied" });
    }

    const client = await getSupabaseAdminClient();
    if (!client) {
      return res.status(500).json({ error: "Storage client not available" });
    }

    const storagePath = `${userId}/${id}.pdf`;

    // Download from Supabase Storage
    const { data, error } = await client.storage
      .from("uploads")
      .download(storagePath);

    if (error) {
      console.error("Download error:", error);
      return res.status(500).json({ error: "Failed to retrieve file" });
    }

    // Convert Blob/File to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdf.filename}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Download PDF error:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/pdf/:id/related
export async function GET_PDF_RELATED(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Get PDF Metadata
    const pdf = await prisma.pdfDocument.findUnique({
      where: { id },
    });

    if (!pdf) {
      return res.status(404).json({ error: "Document not found" });
    }

    // 2. Generate search query from filename (remove .pdf, special chars)
    const query = pdf.filename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    console.log(`Getting related papers for: ${query}`);

    // 3. Search for related papers using PaperRecommendationService
    const papers = await PaperRecommendationService.searchPapers(query, {
      maxResults: 6,
    });

    res.json(papers);
  } catch (error: any) {
    console.error("Get Related Papers error:", error);
    res.status(500).json({ error: error.message });
  }
}
