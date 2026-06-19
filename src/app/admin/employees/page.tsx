import { getEmployees } from "@/actions/employees"
import { getBranches } from "@/actions/branches"
import { EmployeesClient } from "@/components/features/employees/employees-client"

export const dynamic = "force-dynamic"
export default async function EmployeesPage() {
  const [employees, branches] = await Promise.all([getEmployees(), getBranches()])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage tellers and admin accounts</p>
      </div>
      <EmployeesClient employees={employees} branches={branches} />
    </div>
  )
}
