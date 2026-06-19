import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";
import type { Role } from "@prisma/client";

// ─── Type augmentation ────────────────────────────────────────────────────────

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

  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    branchId: string | null;
    isActive: boolean;
  }

  interface JWT {
    id: string;
    role: Role;
    branchId: string | null;
    isActive: boolean;
    lastCheckedAt?: number;
  }
}

// How often (ms) to re-verify isActive/role/branch against the database.
// Without this throttle, every single page load and server action call
// would trigger a DB round trip — on a free-tier pooled connection that
// adds 100-300ms+ to every single request across the whole app.
const REVALIDATE_INTERVAL_MS = 60_000;

// ─── Auth config (Node.js runtime only — never import this in middleware) ─────

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            branchId: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        token.isActive = user.isActive;
        token.lastCheckedAt = Date.now();
        return token;
      }

      // Only hit the database periodically, not on every single request.
      // This is the dominant cost on a free-tier pooled connection — every
      // page load and server action calls auth(), which calls this callback.
      const lastChecked = (token.lastCheckedAt as number | undefined) ?? 0;
      const isStale = Date.now() - lastChecked > REVALIDATE_INTERVAL_MS;

      if (token.id && isStale) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true, role: true, branchId: true },
        });
        token.lastCheckedAt = Date.now();
        if (!dbUser || !dbUser.isActive) {
          return { ...token, isActive: false };
        }
        token.isActive = dbUser.isActive;
        token.role = dbUser.role;
        token.branchId = dbUser.branchId;
      }

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
