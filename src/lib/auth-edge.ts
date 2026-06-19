/**
 * auth-edge.ts — Edge Runtime safe auth config.
 *
 * This file MUST NOT import Prisma, bcrypt, or any Node.js-only module.
 * It is the only auth file imported by src/middleware.ts.
 *
 * It shares the same AUTH_SECRET as auth.ts so JWT tokens are
 * compatible between the two configs.
 */
import NextAuth from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      branchId: string | null;
      isActive: boolean;
    };
  }
  interface JWT {
    id: string;
    role: Role;
    branchId: string | null;
    isActive: boolean;
  }
}

export const { auth: edgeAuth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.branchId = token.branchId as string | null;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
});
