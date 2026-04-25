import apiClient from "./apiClient";

class ContactService {
  // Submit contact form
  static async submitContactForm(
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post("/api/contact", {
        name,
        email,
        subject,
        message,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error: any) {
      console.error("Failed to submit contact form:", error);
      return {
        success: false,
        message:
          error.message ||
          "Failed to submit contact form. Please try again later.",
      };
    }
  }
}

export default ContactService;
