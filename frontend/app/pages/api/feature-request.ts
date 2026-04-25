import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Forward the request to the backend
    const backendResponse = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:3001"}/api/contact/feature-request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await backendResponse.json();

    res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error("Error forwarding feature request to backend:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
