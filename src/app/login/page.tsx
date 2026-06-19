"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", data.email);
      fd.append("password", data.password);

      const result = await loginAction(fd);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // Auth.js set the cookie — now fetch session to get role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      // Hard navigation (not router.push) — avoids Next.js Router Cache
      // serving a stale role's dashboard from a previous session in this tab
      if (role === "SUPER_ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[oklch(0.18_0.02_247)] p-12 relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">X</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              xPortal
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Currency Exchange
              <br />
              Management Platform
            </h1>
            <p className="mt-3 text-[oklch(0.7_0.01_247)] text-base leading-relaxed max-w-sm">
              Real-time rates and multi-branch operations — built for
              modern exchange businesses.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[oklch(0.55_0.01_247)] text-xs">
          <ShieldCheck className="size-3.5" />
          <span>End-to-end encrypted sessions</span>
        </div>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">X</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">xPortal</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-base mt-1.5">
              Sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={cn(
                  "h-12 text-base px-4",
                  errors.email && "border-destructive focus-visible:ring-destructive"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "h-12 text-base px-4 pr-12",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 h-12 text-base"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected by end-to-end encryption. Session expires after 10 min
            inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}