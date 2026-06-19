import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/actions/auth';
import { AlertTriangle } from 'lucide-react';

export default async function NoBranchPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');
  if (session.user.role === 'SUPER_ADMIN') redirect('/admin/dashboard');
  if (session.user.branchId) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md text-center px-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          No Branch Assigned
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account hasn&apos;t been assigned to a branch yet. Please contact
          your Super Admin to assign you to a branch before you can access the
          system.
        </p>
        <div className="mt-6 text-xs text-muted-foreground">
          Logged in as <strong>{session.user.email}</strong>
        </div>
        <form
          action={async () => {
            'use server';
            await logoutAction();
          }}
          className="mt-4"
        >
          <button
            type="submit"
            className="text-sm text-primary underline underline-offset-4"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
