import { Server } from "@hocuspocus/server";
import logger from "../../monitoring/logger";
import { prisma } from "../../lib/prisma";
import { getSupabaseClient } from "../../lib/supabase/client";
import { TiptapTransformer } from "@hocuspocus/transformer";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import Code from "@tiptap/extension-code";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import CharacterCount from "@tiptap/extension-character-count";

interface onAuthenticatePayload {
  token: string;
  documentName: string;
  parameters?: {
    token?: string;
    [key: string]: any; // Allow additional parameters
  };
  connection?: {
    token?: string;
    [key: string]: any; // Allow additional connection properties
  };
  [key: string]: any; // Allow additional properties in the payload
}

// Cache to store content hashes to avoid unnecessary database writes
const lastStoredContentHashes = new Map<string, string>();

export class HocuspocusCollaborationServer {
  private server: Server;
  private port: number;
  private updateQueue = new Map<string, any>();
  private isProcessingQueue = false;

  constructor(port = 9081) {
    this.port = port;
    this.server = new Server({
      port: this.port,
      debounce: 1000,
      maxDebounce: 5000,
      timeout: 30000,
      unloadImmediately: false,
      stopOnSignals: true,
      async onLoadDocument(data) {
        if (!data.documentName.startsWith("project-")) return null;

        const projectId = data.documentName.replace("project-", "");
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { content: true },
          });

          if (project && project.content) {
            const extensions = [
              Document,
              Paragraph,
              Text,
              Bold,
              Italic,
              Strike,
              Underline,
              Heading,
              Blockquote,
              BulletList,
              OrderedList,
              ListItem,
              Link,
              Code,
              HorizontalRule,
              StarterKit,
              Table.configure({ resizable: true }),
              TableRow,
              TableCell,
              TableHeader,
              TaskList,
              TaskItem.configure({ nested: true }),
              Placeholder.configure({ placeholder: "Start writing..." }),
              TextAlign.configure({ types: ["heading", "paragraph"] }),
              Highlight,
              Superscript,
              Subscript,
              CharacterCount,
              TextStyle,
              Link.configure({ openOnClick: false }),
              Underline,
            ];

            return TiptapTransformer.toYdoc(
              project.content,
              "prosemirror",
              extensions,
            );
          }
        } catch (error) {
          logger.error(`Failed to load document ${projectId}:`, error);
        }
        return null;
      },
      async onStoreDocument(data) {
        const { document, documentName } = data;
        try {
          if (!documentName.startsWith("project-")) return;
          const projectId = documentName.replace("project-", "");

          let content = TiptapTransformer.fromYdoc(document, "prosemirror");

          // Validate and prepare content to ensure compatibility with our editor
          const validateAndPrepareContent = (content: any): any => {
            if (!content || typeof content !== "object") return content;

            if (Array.isArray(content)) {
              return content.map(validateAndPrepareContent);
            }

            let processedContent = { ...content };

            // Handle specific node types that need conversion
            if (processedContent.type === "list-item") {
              processedContent.type = "listItem";
            }

            if (processedContent.type === "callout-block") {
              // No changes needed for callout-block
            }

            if (processedContent.type === "cover-page") {
              // No changes needed for cover-page
            }

            if (processedContent.type === "quote-block") {
              // No changes needed for quote-block
            }

            if (processedContent.type === "pricing-table") {
              // No changes needed for pricing-table
            }

            if (processedContent.type === "action-list") {
              processedContent.type = "taskList";
              if (
                processedContent.content &&
                Array.isArray(processedContent.content)
              ) {
                processedContent.content = processedContent.content.map(
                  (child: any) => {
                    if (child.type === "list-item") {
                      return { ...child, type: "taskItem" };
                    }
                    return child;
                  },
                );
              }
            }

            if (processedContent.type === "table") {
              if (!processedContent.attrs) {
                processedContent.attrs = {};
              }
              if (
                processedContent.content &&
                Array.isArray(processedContent.content)
              ) {
                processedContent.content = processedContent.content.map(
                  (row: any) => {
                    if (
                      row &&
                      typeof row === "object" &&
                      row.type === "tableRow"
                    ) {
                      if (row.content && Array.isArray(row.content)) {
                        row.content = row.content.map((cell: any) => {
                          if (
                            cell &&
                            typeof cell === "object" &&
                            (cell.type === "tableCell" ||
                              cell.type === "tableHeader")
                          ) {
                            if (!cell.content) {
                              cell.content = [{ type: "paragraph" }];
                            } else if (!Array.isArray(cell.content)) {
                              cell.content = [
                                {
                                  type: "paragraph",
                                  content: [
                                    {
                                      type: "text",
                                      text: String(cell.content),
                                    },
                                  ],
                                },
                              ];
                            } else if (cell.content.length === 0) {
                              cell.content = [{ type: "paragraph" }];
                            }
                          }
                          return cell;
                        });
                      } else {
                        row.content = [];
                      }
                    }
                    return row;
                  },
                );
              } else {
                processedContent.content = [];
              }
            }

            if (processedContent.type === "tableRow") {
              if (!processedContent.content) {
                processedContent.content = [];
              } else if (!Array.isArray(processedContent.content)) {
                processedContent.content = [
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                ];
              } else if (processedContent.content.length === 0) {
                processedContent.content = [];
              }
            }

            if (
              processedContent.type === "tableCell" ||
              processedContent.type === "tableHeader"
            ) {
              if (!processedContent.content) {
                processedContent.content = [{ type: "paragraph" }];
              } else if (!Array.isArray(processedContent.content)) {
                processedContent.content = [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: String(processedContent.content) },
                    ],
                  },
                ];
              } else if (processedContent.content.length === 0) {
                processedContent.content = [{ type: "paragraph" }];
              }
            }

            // Handle other specific node types
            if (processedContent.type === "visual-element") {
              // No changes needed for visual-element
            }

            if (processedContent.type === "author-block") {
              // No changes needed for author-block
            }

            if (processedContent.type === "author") {
              // No changes needed for author
            }

            if (processedContent.type === "sidebar-block") {
              // No changes needed for sidebar-block
            }

            if (processedContent.type === "caption") {
              // No changes needed for caption
            }

            if (processedContent.type === "image-placeholder") {
              // No changes needed for image-placeholder
            }

            if (processedContent.type === "presentation-deck") {
              // No changes needed for presentation-deck
            }

            if (processedContent.type === "citation-block") {
              // No changes needed for citation-block
            }

            if (processedContent.type === "ai-tag") {
              // No changes needed for ai-tag
            }

            if (processedContent.type === "annotation-block") {
              // No changes needed for annotation-block
            }

            // Recursively process nested content
            if (
              processedContent.content &&
              Array.isArray(processedContent.content)
            ) {
              processedContent.content = processedContent.content.map(
                validateAndPrepareContent,
              );
            }

            return processedContent;
          };

          content = validateAndPrepareContent(content);

          // Create a hash of the content to detect changes
          const contentHash = JSON.stringify(content);
          const lastHash = lastStoredContentHashes.get(projectId);

          // Skip storing if content hasn't changed
          if (contentHash === lastHash && lastHash !== undefined) {
            logger.debug("Document content unchanged, skipping store", {
              projectId,
              timestamp: new Date().toISOString(),
            });
            return;
          }

          lastStoredContentHashes.set(projectId, contentHash);

          // Use a database transaction to ensure consistency
          await prisma.$transaction(async (tx: any) => {
            const current = await tx.project.findUnique({
              where: { id: projectId },
              select: { id: true, content: true, updated_at: true },
            });

            if (!current) {
              throw new Error(`Project not found: ${projectId}`);
            }

            const currentContentHash = JSON.stringify(current.content);

            // Check if content has changed since we last read it (to detect parallel saves)
            if (currentContentHash !== lastHash && lastHash !== undefined) {
              logger.warn(
                "Parallel save detected in onStoreDocument - Hocuspocus overwriting",
                {
                  projectId,
                  timestamp: new Date().toISOString(),
                },
              );
            }

            // Update the project with new content
            await tx.project.update({
              where: { id: projectId },
              data: {
                content: content,
                updated_at: new Date(),
              },
            });
          });

          logger.info("Document stored in database (no version created)", {
            projectId,
            timestamp: new Date().toISOString(),
            message: "Frequent save for CRDT protection, not versioning",
          });
        } catch (error) {
          logger.error("Error storing document:", {
            error: (error as Error).message || error,
            stack: (error as Error).stack,
            documentName,
            timestamp: new Date().toISOString(),
          });
        }
      },
      async onAuthenticate(data: onAuthenticatePayload) {
        const { token, documentName, parameters } = data;

        // Log the authentication attempt
        logger.info("WebSocket connection attempt", {
          documentName,
          documentNameType: typeof documentName,
          documentNameLength: documentName?.length,
          documentNamePreview: documentName
            ? documentName.substring(0, 100)
            : null,
          hasToken: !!token,
          hasParameters: !!parameters,
          timestamp: new Date().toISOString(),
        });

        try {
          // Helper function to safely stringify objects with circular references
          const safeStringify = (obj: any, space = 2) => {
            const seen = new WeakSet();
            return JSON.stringify(
              obj,
              (key, val) => {
                if (val != null && typeof val == "object") {
                  if (seen.has(val)) return "[Circular]";
                  seen.add(val);
                }
                return val;
              },
              space,
            );
          };

          logger.info("Full authentication data received", {
            documentName,
            token: token ? `${token.substring(0, 10)}...` : null,
            tokenLength: token?.length || 0,
            hasParameters: !!parameters,
            parameters: parameters ? Object.keys(parameters) : null,
            parametersToken: parameters?.token
              ? `${parameters.token.substring(0, 10)}...`
              : null,
            parametersTokenLength: parameters?.token?.length || 0,
            allDataKeys: Object.keys(data),
            dataSample: safeStringify(data).substring(0, 500),
            documentNameParts: documentName?.split("?"),
            timestamp: new Date().toISOString(),
          });

          logger.info("Detailed data inspection", {
            hasTokenDirectly: !!token,
            hasTokenInParameters: !!(parameters && parameters.token),
            hasTokenInConnection: !!(data as any).connection?.token,
            hasTokenInData: !!(data as any).token,
            hasTokenInAuth: !!(data as any).auth?.token,
            hasTokenInConnectionParameters: !!(data as any).connectionParameters
              ?.token,
            documentNameContainsQuery: documentName?.includes("?"),
            documentNameQueryParams: documentName?.split("?")[1],
          });

          logger.info("Raw data structure inspection", {
            dataKeys: Object.keys(data),
            hasConnection: !!(data as any).connection,
            connectionType: (data as any).connection
              ? typeof (data as any).connection
              : null,
            hasRequest: !!(data as any).request,
            requestType: (data as any).request
              ? typeof (data as any).request
              : null,
            hasInstance: !!(data as any).instance,
            instanceType: (data as any).instance
              ? typeof (data as any).instance
              : null,
          });

          logger.debug("Raw authentication data", {
            rawDataKeys: Object.keys(data),
            rawParameters: parameters,
            rawToken: token,
          });

          // Try to extract the token from various possible locations
          let authToken = token;
          if (!authToken && parameters && parameters.token) {
            authToken = parameters.token;
          }
          if (!authToken && (data as any).token) {
            authToken = (data as any).token;
          }
          if (!authToken && (data as any).connection?.token) {
            authToken = (data as any).connection.token;
          }
          if (!authToken && (data as any).connectionParameters?.token) {
            authToken = (data as any).connectionParameters.token;
          }
          if (!authToken && (data as any).auth?.token) {
            authToken = (data as any).auth.token;
          }

          // Try to extract token from documentName as query parameter
          if (!authToken) {
            try {
              const parts = documentName.split("?");
              logger.debug("Document name parts for token extraction", {
                parts: parts,
                partsLength: parts.length,
              });

              if (parts.length > 1) {
                const urlParams = new URLSearchParams(parts[1]);
                const urlToken = urlParams.get("token");

                logger.debug("URL token extraction result", {
                  hasUrlToken: !!urlToken,
                  urlTokenPreview: urlToken ? urlToken.substring(0, 10) : null,
                });

                if (urlToken) {
                  authToken = urlToken;
                }
              }
            } catch (urlError) {
              logger.debug("Could not parse token from URL", {
                error: urlError,
              });
            }
          }

          // Final attempt to extract token from documentName as URL
          if (!authToken) {
            try {
              let documentUrl;
              if (
                documentName.startsWith("http") ||
                documentName.startsWith("ws")
              ) {
                documentUrl = new URL(documentName);
              } else {
                documentUrl = new URL(`http://localhost/${documentName}`);
              }
              const urlToken = documentUrl.searchParams.get("token");

              logger.debug("Final token extraction attempt", {
                hasUrlToken: !!urlToken,
                urlTokenPreview: urlToken ? urlToken.substring(0, 10) : null,
              });

              if (urlToken) {
                authToken = urlToken;
              }
            } catch (urlError) {
              logger.debug("Could not parse documentName as URL", {
                error: urlError,
                documentName: documentName,
              });
            }
          }

          if (authToken) {
            logger.info("Token found", {
              source: token
                ? "direct"
                : parameters?.token
                  ? "parameters"
                  : "data",
              tokenLength: authToken.length,
              timestamp: new Date().toISOString(),
            });
          }

          // If no token found, reject the connection
          if (!authToken) {
            logger.warn("Authentication failed: No token provided", {
              documentName,
              tokenSources: {
                directToken: !!token,
                parametersToken: !!(parameters && parameters.token),
                dataToken: !!(data as any).token,
                connectionToken: !!(data as any).connection?.token,
                connectionParametersToken: !!(data as any).connectionParameters
                  ?.token,
                authToken: !!(data as any).auth?.token,
              },
              receivedData: {
                hasToken: !!token,
                hasParameters: !!parameters,
                parametersKeys: parameters ? Object.keys(parameters) : null,
                dataKeys: Object.keys(data),
              },
              timestamp: new Date().toISOString(),
            });

            logger.info("Sending AUTH_REQUIRED response to client");
            const authRequiredError = new Error(
              "AUTH_REQUIRED: No authentication token provided. Please ensure you are logged in and have a valid session.",
            );
            (authRequiredError as any).code = "AUTH_REQUIRED";
            (authRequiredError as any).reason = "AUTH_REQUIRED";
            throw authRequiredError;
          }

          let userRecord: any;
          try {
            // We only need the regular supabase client for token verification
            logger.info("Using supabase client for token verification");

            // Use the regular supabase client to verify the user token
            // The admin client should not be used for token verification
            const supabase = await getSupabaseClient();
            const supabaseUrl = await (supabase as any).supabaseUrl; // Hacky way to see what URL it's using

            logger.info("Attempting Supabase getUser verification", {
              url: supabaseUrl,
              tokenPreview: authToken
                ? `${authToken.substring(0, 10)}...`
                : "NONE",
              tokenLength: authToken?.length,
            });

            const result = await supabase.auth.getUser(authToken);
            const { data: userData, error } = result;

            if (error || !userData?.user) {
              logger.warn("Authentication failed: Supabase Auth error", {
                documentName,
                error: error?.message,
                errorCode: error?.code,
                errorStatus: error?.status,
                supabaseUrl,
                timestamp: new Date().toISOString(),
              });

              if (
                error?.message &&
                (error.message.includes("token is expired") ||
                  error.message.includes("Invalid JWT") ||
                  error.code === "invalid_jwt")
              ) {
                logger.warn(
                  "Token expired or invalid, requesting client to refresh",
                  {
                    documentName,
                    userId: (result.data as any)?.user?.id || "unknown",
                    errorCode: error?.code,
                    errorStatus: error?.status,
                    timestamp: new Date().toISOString(),
                  },
                );

                const tokenExpiredError = new Error(
                  "TOKEN_EXPIRED: Authentication token has expired",
                );
                (tokenExpiredError as any).code = "TOKEN_EXPIRED";
                (tokenExpiredError as any).reason = "TOKEN_EXPIRED";
                throw tokenExpiredError;
              }

              throw new Error(
                `Authentication failed: ${error?.message || "Unknown error"}`,
              );
            }

            userRecord = userData.user;
          } catch (error) {
            logger.warn("Authentication failed: Supabase Auth error", {
              documentName,
              error: (error as Error).message,
              stack: (error as Error).stack,
              timestamp: new Date().toISOString(),
            });

            if (
              (error as Error).message &&
              ((error as Error).message.includes("token is expired") ||
                (error as Error).message.includes("Invalid JWT"))
            ) {
              logger.warn(
                "Token expired or invalid, requesting client to refresh",
                {
                  documentName,
                  userId: (error as any).userId || "unknown",
                  timestamp: new Date().toISOString(),
                },
              );

              const tokenExpiredError = new Error(
                "TOKEN_EXPIRED: Authentication token has expired",
              );
              (tokenExpiredError as any).code = "TOKEN_EXPIRED";
              (tokenExpiredError as any).reason = "TOKEN_EXPIRED";
              throw tokenExpiredError;
            }

            throw new Error(
              `Authentication failed: ${(error as Error).message}`,
            );
          }

          if (!userRecord) {
            logger.warn("Authentication failed: No user found", {
              documentName,
              timestamp: new Date().toISOString(),
            });
            throw new Error("Authentication failed: No user found");
          }

          // Extract project or workspace ID from document name
          const projectIdMatch = documentName.match(/^project-(.+)$/);
          const workspaceIdMatch = documentName.match(/^workspace-(.+)$/);

          if (!projectIdMatch && !workspaceIdMatch) {
            logger.warn("Invalid document name format", {
              documentName,
              timestamp: new Date().toISOString(),
            });
            throw new Error("Invalid document name format");
          }

          let authenticatedId = "";
          let type = "";

          if (projectIdMatch) {
            authenticatedId = projectIdMatch[1];
            type = "project";
            try {
              // Check if user has access to the project
              const project = await prisma.project.findFirst({
                where: {
                  id: authenticatedId,
                  OR: [
                    { user_id: userRecord.id },
                    { collaborators: { some: { user_id: userRecord.id } } },
                    {
                      workspace: {
                        members: { some: { user_id: userRecord.id } },
                      },
                    },
                  ],
                },
              });

              if (!project) {
                logger.warn("User access denied to project", {
                  documentName,
                  userId: userRecord.id,
                  projectId: authenticatedId,
                  timestamp: new Date().toISOString(),
                });
                throw new Error(
                  "Access denied: User does not have permission to access this document",
                );
              }
            } catch (dbError) {
              logger.error("Database error during project authentication", {
                documentName,
                userId: userRecord.id,
                error: (dbError as Error).message,
              });
              throw dbError;
            }
          } else if (workspaceIdMatch) {
            authenticatedId = workspaceIdMatch[1];
            type = "workspace";
            try {
              // Check if user is a member of the workspace
              const workspaceMember = await prisma.workspaceMember.findFirst({
                where: {
                  workspace_id: authenticatedId,
                  user_id: userRecord.id,
                },
              });

              if (!workspaceMember) {
                logger.warn("User access denied to workspace", {
                  documentName,
                  userId: userRecord.id,
                  workspaceId: authenticatedId,
                  timestamp: new Date().toISOString(),
                });
                throw new Error(
                  "Access denied: User is not a member of this workspace",
                );
              }
            } catch (dbError) {
              logger.error("Database error during workspace authentication", {
                documentName,
                userId: userRecord.id,
                error: (dbError as Error).message,
              });
              throw dbError;
            }
          }

          logger.info("User authenticated successfully", {
            documentName,
            userId: userRecord.id,
            userEmail: userRecord.email,
            id: authenticatedId,
            type,
            timestamp: new Date().toISOString(),
          });

          // Return user information for the WebSocket connection
          return {
            id: userRecord.id,
            name:
              userRecord.user_metadata?.full_name ||
              userRecord.email?.split("@")[0] ||
              "User",
            email: userRecord.email,
          };
        } catch (error) {
          logger.error("Authentication error", {
            documentName,
            error: (error as Error).message,
            stack: (error as Error).stack,
            timestamp: new Date().toISOString(),
          });
          throw error;
        }
      },

      async onDisconnect(data) {
        const { documentName, socketId, context } = data;
        logger.info("Client disconnected", {
          documentName,
          socketId,
          timestamp: new Date().toISOString(),
        });

        // Only handle project-specific presence cleanup
        if (documentName.startsWith("project-")) {
          try {
            const projectId = documentName.replace("project-", "");
            const userId = (context as any)?.user?.id;
            if (projectId && userId) {
              // Update user presence to offline in the database
              try {
                await prisma.collaboratorPresence.update({
                  where: {
                    project_id_user_id: {
                      project_id: projectId,
                      user_id: userId,
                    },
                  },
                  data: {
                    last_active_at: new Date(),
                  },
                });

                logger.info("User marked as offline in presence database", {
                  project_id: projectId,
                  user_id: userId,
                  timestamp: new Date().toISOString(),
                });
              } catch (presenceError) {
                logger.error("Error updating user presence on disconnect:", {
                  error: (presenceError as Error).message,
                  project_id: projectId,
                  user_id: userId,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } catch (error) {
            logger.error("Error marking user as offline in presence system:", {
              error,
              documentName,
              socketId,
            });
          }
        }
      },

      async onAwarenessUpdate(data) {
        const { documentName, added, updated, removed } = data;
        logger.debug("Awareness updated", {
          documentName,
          added,
          updated,
          removed,
          timestamp: new Date().toISOString(),
        });
      },
    });
  }

  async start(): Promise<void> {
    try {
      await this.server.listen();
      logger.info(`Hocuspocus server started on port ${this.port}`, {
        port: this.port,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to start Hocuspocus server", {
        error: (error as Error).message,
        stack: (error as Error).stack,
        port: this.port,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.server.destroy();
      logger.info("Hocuspocus server stopped", {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error stopping Hocuspocus server", {
        error: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getServerInstance() {
    return this.server;
  }

  private async processUpdateQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      for (const [projectId, updateData] of this.updateQueue.entries()) {
        logger.debug("Processing queued update", {
          projectId,
          timestamp: new Date().toISOString(),
        });
      }
      this.updateQueue.clear();
    } catch (error) {
      logger.error("Error processing update queue", {
        error: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString(),
      });
    } finally {
      this.isProcessingQueue = false;
    }
  }
}
