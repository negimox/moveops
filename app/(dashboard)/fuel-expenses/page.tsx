'use client'

import { useEffect, useState, useMemo } from 'react'
import { Banknote, Fuel, Plus, Calendar, ArrowUpDown, Tag, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

import CreateFuelLogModal from '@/components/finance/CreateFuelLogModal'
import CreateExpenseModal from '@/components/finance/CreateExpenseModal'

type FuelLog = {
  id: number
  vehicle_name: string
  registration_no: string
  liters: string
  cost: string
  fuel_type: string
  station: string
  logged_at: string
  logged_by_name: string
}

type Expense = {
  id: number
  category: string
  amount: string
  description: string
  vehicle_name: string
  trip_code: string
  logged_at: string
  logged_by_name: string
}

export default function FuelExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [fRes, eRes] = await Promise.all([
        fetch('/api/fuel-logs').catch(() => null),
        fetch('/api/expenses').catch(() => null)
      ])

      if (fRes && fRes.ok) {
        const fData = await fRes.json()
        setFuelLogs(fData.logs)
      }
      
      if (eRes && eRes.ok) {
        const eData = await eRes.json()
        setExpenses(eData.expenses)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user) })
      .catch(console.error)
      
    fetchData()
  }, [])

  const fuelColumns = useMemo<ColumnDef<FuelLog>[]>(() => [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 hover:bg-transparent">
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.logged_at).toLocaleDateString()}</span>
    },
    {
      accessorKey: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.vehicle_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.registration_no}</div>
        </div>
      )
    },
    {
      accessorKey: "fuel_type",
      header: "Fuel Type",
      cell: ({ row }) => <span className="px-2 py-1 bg-slate-800 rounded-md text-xs">{row.original.fuel_type}</span>
    },
    {
      accessorKey: "liters",
      header: "Quantity",
      cell: ({ row }) => <span>{row.original.liters} L</span>
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => <span className="font-medium text-emerald-400">₹{Number(row.original.cost).toLocaleString()}</span>
    },
    {
      accessorKey: "station",
      header: "Station",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.station || '-'}</span>
    },
    {
      accessorKey: "logged_by",
      header: "Logged By",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.logged_by_name}</span>
    }
  ], [])

  const expenseColumns = useMemo<ColumnDef<Expense>[]>(() => [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4 hover:bg-transparent">
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.logged_at).toLocaleDateString()}</span>
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-xs">{row.original.category}</span>
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-medium text-emerald-400">₹{Number(row.original.amount).toLocaleString()}</span>
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-sm truncate max-w-[200px] block" title={row.original.description}>{row.original.description || '-'}</span>
    },
    {
      accessorKey: "associated",
      header: "Associated With",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.vehicle_name && (
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1">
              <Truck className="w-3 h-3" /> {row.original.vehicle_name}
            </span>
          )}
          {row.original.trip_code && (
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {row.original.trip_code}
            </span>
          )}
          {!row.original.vehicle_name && !row.original.trip_code && <span className="text-muted-foreground">-</span>}
        </div>
      )
    },
    {
      accessorKey: "logged_by",
      header: "Logged By",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.logged_by_name}</span>
    }
  ], [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            Fuel & Expenses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track fleet fuel consumption and operational costs.</p>
        </div>
        
        {user?.role === 'financial_analyst' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFuelModalOpen(true)} className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
              <Plus className="w-4 h-4 mr-2" /> Log Fuel
            </Button>
            <Button onClick={() => setIsExpenseModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Log Expense
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Fuel className="w-4 h-4 text-emerald-500" /></div>
              Total Fuel Cost (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{fuelLogs.reduce((acc, log) => acc + Number(log.cost), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Banknote className="w-4 h-4 text-indigo-500" /></div>
              Total Operational Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{expenses.reduce((acc, exp) => acc + Number(exp.amount), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Calendar className="w-4 h-4 text-blue-500" /></div>
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fuelLogs.length + expenses.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
          <TabsTrigger value="expenses">Operational Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fuel" className="mt-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <DataTable columns={fuelColumns} data={fuelLogs} searchKey="station" searchPlaceholder="Search by station..." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <DataTable columns={expenseColumns} data={expenses} searchKey="category" searchPlaceholder="Search by category..." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateFuelLogModal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} onSuccess={fetchData} />
      <CreateExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSuccess={fetchData} />
    </div>
  )
}
