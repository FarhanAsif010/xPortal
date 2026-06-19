"use client"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pencil, UserX, UserCheck, Loader2, Shield, User, Eye, EyeOff, Check, X, Trash2, KeyRound } from "lucide-react"
import { createEmployeeSchema, type CreateEmployeeInput } from "@/schemas/employee"
import { createEmployee, updateEmployee, deleteEmployee, resetEmployeePassword } from "@/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Role } from "@prisma/client"

type Employee = { id: string; name: string; email: string; role: Role; isActive: boolean; branchId: string | null; createdAt: Date; branch: { name: string } | null }
type Branch = { id: string; name: string; isActive: boolean }

export function EmployeesClient({ employees: initial, branches }: { employees: Employee[], branches: Branch[] }) {
  const [employees] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetPasswordValue, setResetPasswordValue] = useState("")
  const [showResetPasswordText, setShowResetPasswordText] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const { toast } = useToast()

  const getPasswordChecks = (value: string) => [
    { label: "8+ characters", met: value.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(value) },
    { label: "Lowercase letter", met: /[a-z]/.test(value) },
    { label: "Number", met: /[0-9]/.test(value) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(value) },
  ]
  const passwordChecks = getPasswordChecks(passwordValue)
  const resetPasswordChecks = getPasswordChecks(resetPasswordValue)
  const resetPasswordValid = resetPasswordChecks.every(c => c.met)

  const form = useForm<CreateEmployeeInput>({ resolver: zodResolver(createEmployeeSchema), defaultValues: { role: "TELLER" } })

  const handleCreate = form.handleSubmit((data) => {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)))
      const res = await createEmployee(fd)
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      toast({ title: "Employee created" })
      setShowCreate(false); form.reset(); setPasswordValue(""); setShowPassword(false); location.reload()
    })
  })

  const handleToggle = (emp: Employee) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("id", emp.id); fd.append("isActive", String(!emp.isActive))
      await updateEmployee(fd)
      toast({ title: emp.isActive ? "Employee disabled" : "Employee enabled" })
      location.reload()
    })
  }

  const handleResetPassword = () => {
    if (!editEmp) return
    setResetError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("id", editEmp.id)
      fd.append("password", resetPasswordValue)
      const res = await resetEmployeePassword(fd)
      if (res.error) { setResetError(res.error); return }
      toast({ title: "Password reset", description: `${editEmp.name}'s password has been updated.` })
      setShowResetPassword(false)
      setResetPasswordValue("")
      setShowResetPasswordText(false)
    })
  }

  const handleDelete = () => {
    if (!deleteEmp) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append("id", deleteEmp.id)
      const res = await deleteEmployee(fd)
      if (res.error) {
        toast({ title: "Cannot delete employee", description: res.error, variant: "destructive" })
        setDeleteEmp(null)
        return
      }
      toast({ title: "Employee deleted" })
      setDeleteEmp(null)
      location.reload()
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="size-4" />New Employee</Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {["Name", "Role", "Branch", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map(e => (
              <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={e.role === "SUPER_ADMIN" ? "default" : "secondary"} className="gap-1">
                    {e.role === "SUPER_ADMIN" ? <Shield className="size-3" /> : <User className="size-3" />}
                    {e.role === "SUPER_ADMIN" ? "Admin" : "Teller"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.branch?.name ?? <span className="italic text-muted-foreground/50">Unassigned</span>}</td>
                <td className="px-4 py-3"><Badge variant={e.isActive ? "success" : "secondary"}>{e.isActive ? "Active" : "Disabled"}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(e.createdAt), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setEditEmp(e)}><Pencil className="size-3" />Edit</Button>
                    <Button size="sm" variant={e.isActive ? "destructive" : "outline"} className="h-7 gap-1 text-xs" onClick={() => handleToggle(e)} disabled={isPending}>
                      {e.isActive ? <UserX className="size-3" /> : <UserCheck className="size-3" />}{e.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteEmp(e)} disabled={isPending}>
                      <Trash2 className="size-3" />Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No employees yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { form.reset(); setPasswordValue(""); setShowPassword(false) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Employee</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="Jane Smith" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="jane@company.com" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pr-10"
                  {...form.register("password")}
                  onChange={(e) => { form.setValue("password", e.target.value); setPasswordValue(e.target.value) }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
              <div className="grid grid-cols-2 gap-1 pt-1">
                {passwordChecks.map(c => (
                  <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {c.met ? <Check className="size-3" /> : <X className="size-3 opacity-40" />}
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select defaultValue="TELLER" onValueChange={v => form.setValue("role", v as Role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TELLER">Teller</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select onValueChange={v => form.setValue("branchId", v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {branches.filter(b => b.isActive).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin mr-2" />}Create Employee</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editEmp} onOpenChange={(open) => {
        if (!open) {
          setEditEmp(null)
          setShowResetPassword(false)
          setResetPasswordValue("")
          setShowResetPasswordText(false)
          setResetError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          {editEmp && (
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              fd.append("id", editEmp.id)
              startTransition(async () => {
                const res = await updateEmployee(fd)
                if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
                toast({ title: "Employee updated" }); setEditEmp(null); location.reload()
              })
            }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input name="name" defaultValue={editEmp.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <select name="branchId" defaultValue={editEmp.branchId ?? "none"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="none">Unassigned</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditEmp(null)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin mr-2" />}Save</Button>
              </DialogFooter>
            </form>
          )}

          {/* Reset Password section */}
          {editEmp && (
            <div className="border-t border-border pt-4 mt-1">
              {!showResetPassword ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowResetPassword(true)}
                >
                  <KeyRound className="size-4" /> Reset Password
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showResetPasswordText ? "text" : "password"}
                      placeholder="Enter a strong new password"
                      className="pr-10"
                      value={resetPasswordValue}
                      onChange={(e) => { setResetPasswordValue(e.target.value); setResetError(null) }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPasswordText(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showResetPasswordText ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {resetError && <p className="text-xs text-destructive">{resetError}</p>}
                  <div className="grid grid-cols-2 gap-1">
                    {resetPasswordChecks.map(c => (
                      <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {c.met ? <Check className="size-3" /> : <X className="size-3 opacity-40" />}
                        {c.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setShowResetPassword(false); setResetPasswordValue(""); setResetError(null) }}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleResetPassword}
                      disabled={isPending || !resetPasswordValid}
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <KeyRound className="size-4 mr-2" />}
                      Set New Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteEmp} onOpenChange={(open) => !open && setDeleteEmp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Employee</DialogTitle></DialogHeader>
          {deleteEmp && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to permanently delete <span className="font-semibold text-foreground">{deleteEmp.name}</span> ({deleteEmp.email})? This action cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground">
                If this employee has processed any transactions, deletion will be blocked to preserve transaction history — disable their account instead in that case.
              </p>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDeleteEmp(null)} disabled={isPending}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
                  Delete Permanently
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}