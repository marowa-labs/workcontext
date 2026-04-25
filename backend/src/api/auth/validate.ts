import { prisma } from "../../lib/prisma";

// Validate if user details already exist
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber } = body;

    const validationResults: {
      fullNameExists?: boolean;
      emailExists?: boolean;
      phoneNumberExists?: boolean;
      message?: string;
    } = {};

    // Check for existing user with same full name
    if (fullName) {
      const existingUserByName = await prisma.user.findFirst({
        where: {
          full_name: {
            equals: fullName,
            mode: "insensitive", // Case insensitive comparison
          },
        },
      });

      if (existingUserByName) {
        validationResults.fullNameExists = true;
        validationResults.message =
          "A user with this name is already registered.";
      }
    }

    // Check for existing user with same email
    if (email) {
      const existingUserByEmail = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive", // Case insensitive comparison
          },
        },
      });

      if (existingUserByEmail) {
        validationResults.emailExists = true;
        validationResults.message =
          "A user with this email is already registered.";
      }
    }

    // Check for existing user with same phone number
    if (phoneNumber) {
      const existingUserByPhone = await prisma.user.findFirst({
        where: {
          phone_number: {
            equals: phoneNumber,
            mode: "insensitive", // Case insensitive comparison
          },
        },
      });

      if (existingUserByPhone) {
        validationResults.phoneNumberExists = true;
        validationResults.message =
          "A user with this phone number is already registered.";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        validationResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
