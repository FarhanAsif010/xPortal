"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pencil, Power, MapPin, Users, ArrowLeftRight, Loader2, Building2, ChevronRight } from "lucide-react"
import { createBranchSchema, type CreateBranchInput } from "@/schemas/branch"
import { createBranch, updateBranch, toggleBranchStatus } from "@/actions/branches"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

type Branch = {
  id: string; name: string; location: string; isActive: boolean; createdAt: string
  _count: { users: number; transactions: number }
}

export function BranchesClient({ branches: initial }: { branches: Branch[] }) {
  const [branches, setBranches] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Branch | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<CreateBranchInput>({ resolver: zodResolver(createBranchSchema) })
  const editForm = useForm<CreateBranchInput>({ resolver: zodResolver(createBranchSchema) })

  const handleCreate = form.handleSubmit((data) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("name", data.name)
      fd.append("location", data.location)
      const res = await createBranch(fd)
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      toast({ title: "Branch created" })
      setShowCreate(false); form.reset(); location.reload()
    })
  })

  const handleEdit = editForm.handleSubmit((data) => {
    if (!editBranch) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append("id", editBranch.id); fd.append("name", data.name); fd.append("location", data.location)
      const res = await updateBranch(fd)
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      toast({ title: "Branch updated" })
      setBranches(prev => prev.map(b => b.id === editBranch.id ? { ...b, name: data.name, location: data.location } : b))
      setEditBranch(null)
    })
  })

  const handleToggle = () => {
    if (!toggleTarget) return
    startTransition(async () => {
      await toggleBranchStatus(toggleTarget.id, !toggleTarget.isActive)
      toast({ title: toggleTarget.isActive ? "Branch deactivated" : "Branch activated" })
      setBranches(prev => prev.map(b => b.id === toggleTarget.id ? { ...b, isActive: !b.isActive } : b))
      setToggleTarget(null)
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="size-4" /> New Branch
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {branches.map(b => (
          <Card
            key={b.id}
            className={`${!b.isActive ? "opacity-70" : ""} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => router.push(`/admin/branches/${b.id}`)}
          >
            <CardContent className="p-5 space-y-4">
              {/* Branch header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{b.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{b.location}</span>
                  </div>
                </div>
                <Badge variant={b.isActive ? "success" : "secondary"}>
                  {b.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="size-3" />{b._count.users} tellers</span>
                <span className="flex items-center gap-1"><ArrowLeftRight className="size-3" />{b._count.transactions} txns</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Created {format(new Date(b.createdAt), "MMM d, yyyy")}
              </p>

              {/* Branch Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1"
                  onClick={(e) => { e.stopPropagation(); setEditBranch(b); editForm.reset({ name: b.name, location: b.location }) }}>
                  <Pencil className="size-3" /> Edit
                </Button>
                <Button size="sm" variant={b.isActive ? "destructive" : "outline"} className="flex-1 gap-1"
                  onClick={(e) => { e.stopPropagation(); setToggleTarget(b) }}>
                  <Power className="size-3" /> {b.isActive ? "Disable" : "Enable"}
                </Button>
              </div>

              {/* View Details */}
              <div className="flex items-center justify-end text-xs text-muted-foreground gap-1 -mb-1">
                <span>View details</span>
                <ChevronRight className="size-3" />
              </div>

            </CardContent>
          </Card>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Building2 className="size-10 mb-3 opacity-30" />
            <p className="font-medium">No branches yet</p>
            <p className="text-sm">Create your first branch to get started</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Branch</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branch Name</Label>
              <Input placeholder="Downtown Branch" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="123 Main St, City" {...form.register("location")} />
              {form.formState.errors.location && <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin mr-2" />}Create Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBranch} onOpenChange={() => setEditBranch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Branch</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branch Name</Label>
              <Input {...editForm.register("name")} />
              {editForm.formState.errors.name && <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input {...editForm.register("location")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditBranch(null)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin mr-2" />}Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Confirm */}
      <AlertDialog open={!!toggleTarget} onOpenChange={() => setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleTarget?.isActive ? "Deactivate" : "Activate"} Branch?</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? "Tellers at this branch will lose access until reactivated."
                : "This will restore access for all tellers at this branch."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}
              className={toggleTarget?.isActive ? "bg-destructive hover:bg-destructive/90" : ""}>
              {toggleTarget?.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
