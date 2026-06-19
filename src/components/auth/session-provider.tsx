"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { logoutAction } from "@/actions/auth";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

function SessionTimeoutGuard({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useSessionTimeout({
    enabled: !!session?.user,
    onTimeout: async () => {
      await logoutAction();
    },
  });

  return <>{children}</>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionTimeoutGuard>{children}</SessionTimeoutGuard>
    </NextAuthSessionProvider>
  );
}