"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/schemas/auth";
import { AuthError } from "next-auth";
import type { Role } from "@prisma/client";

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  formData: FormData
): Promise<LoginResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "Authentication failed. Try again." };
      }
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Server action to get current session user details.
 * Used by client components that cannot import auth() directly.
 */
export async function getSessionUser() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    branchId: session.user.branchId,
    isActive: session.user.isActive,
  };
}