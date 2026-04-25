import { ContactService } from "../../services/contactService";

// POST /api/contact - Handle contact form submission
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({
          error: "All fields are required: name, email, subject, message",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get IP address and user agent from request
    const ip_address =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const user_agent = request.headers.get("user-agent") || "unknown";

    // Process the contact form submission
    const result = await ContactService.handleContactSubmission({
      name,
      email,
      subject,
      message,
      ip_address,
      user_agent,
    });

    return new Response(
      JSON.stringify({
        message: "Your message has been sent successfully",
        result,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing contact form:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process contact form submission",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
