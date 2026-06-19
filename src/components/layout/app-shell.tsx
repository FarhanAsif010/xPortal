"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard, Building2, Users, TrendingUp, FileText,
  ShieldCheck, LogOut, Menu, X, ChevronDown, Sun, Moon, ArrowLeftRight
} from "lucide-react"
import { useTheme } from "next-themes"
import { logoutAction } from "@/actions/auth"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const adminNav = [
  { label: "Dashboard",         href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Currency Exchange",  href: "/admin/exchange",  icon: ArrowLeftRight },
  { label: "Branches",           href: "/admin/branches",  icon: Building2 },
  { label: "Employees",          href: "/admin/employees", icon: Users },
  { label: "Exchange Rates",     href: "/admin/rates",     icon: TrendingUp },
  { label: "Audit Logs",         href: "/admin/audit",     icon: ShieldCheck },
]

const tellerNav = [
  { label: "Transaction Desk", href: "/dashboard",          icon: ArrowLeftRight },
  { label: "Branches",         href: "/dashboard/branches", icon: Building2 },
  { label: "Exchange Rates",   href: "/dashboard/rates",    icon: TrendingUp },
  { label: "My History",       href: "/dashboard/history",  icon: FileText },
]

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const nav = isAdmin ? adminNav : tellerNav

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">X</span>
          </div>
          <span className="font-semibold tracking-tight">xPortal</span>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3 pt-3 pb-1">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full",
            isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {isAdmin ? <ShieldCheck className="size-3" /> : <ArrowLeftRight className="size-3" />}
            {isAdmin ? "Super Admin" : "Teller"}
          </span>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin/dashboard" || href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}>
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[11px]">{initials(session?.user?.name ?? "?")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="text-xs text-muted-foreground">{isAdmin ? "Super Admin" : "Teller"}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive"
                onClick={async () => { await logoutAction() }}>
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 gap-3">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {isAdmin ? "Admin Console" : "Teller Workspace"}
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
