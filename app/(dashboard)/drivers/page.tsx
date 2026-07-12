'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, ShieldCheck, ShieldAlert, CheckCircle2, Shield, MoreHorizontal } from 'lucide-react'
import AddDriverModal from '@/components/drivers/AddDriverModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Driver = {
  id: number
  name: string
  contact: string
  license_id: string
  license_verified: boolean
  license_expiry: string | null
  category: string
  status: 'pending_approval' | 'available' | 'on_trip' | 'off_duty' | 'suspended'
  trip_count: number
  safety_score: number
}

type UserContext = {
  id: number
  name: string
  email: string
  role: string
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [user, setUser] = useState<UserContext | null>(null)
  const [approving, setApproving] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error)

    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/drivers')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDrivers(data.drivers)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const approveDriver = async (id: number) => {
    try {
      setApproving(id)
      const res = await fetch(`/api/drivers/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      fetchDrivers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setApproving(null)
    }
  }

  const statusColors = {
    pending_approval: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    on_trip: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    off_duty: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Drivers & Compliance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage driver records, track compliance, and verify licenses.</p>
        </div>
        
        {user?.role === 'safety_officer' && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Register Driver
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-4 h-4 text-primary" /></div>
              Total Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drivers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drivers.filter(d => d.status === 'available').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Shield className="w-4 h-4 text-purple-500" /></div>
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drivers.filter(d => d.status === 'pending_approval').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg"><ShieldAlert className="w-4 h-4 text-red-500" /></div>
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{drivers.filter(d => d.status === 'suspended').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold uppercase text-xs">Driver Name</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Contact</TableHead>
                <TableHead className="font-semibold uppercase text-xs">License (DigiLocker)</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Safety Score</TableHead>
                <TableHead className="font-semibold uppercase text-xs text-center">Status</TableHead>
                <TableHead className="font-semibold uppercase text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading drivers...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-destructive bg-destructive/10">
                    {error}
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No drivers registered.
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.category}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{d.contact}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm uppercase text-muted-foreground">{d.license_id}</span>
                        {d.license_verified ? (
                          <span title="Verified by DigiLocker"><ShieldCheck className="w-4 h-4 text-emerald-500" /></span>
                        ) : (
                          <span title="Unverified"><ShieldAlert className="w-4 h-4 text-amber-500" /></span>
                        )}
                      </div>
                      {d.license_expiry && (
                        <div className="text-xs text-muted-foreground mt-0.5">Exp: {new Date(d.license_expiry).toLocaleDateString()}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-24">
                          <div 
                            className={`h-full rounded-full ${d.safety_score > 80 ? 'bg-emerald-500' : d.safety_score > 50 ? 'bg-amber-500' : 'bg-destructive'}`} 
                            style={{ width: `${d.safety_score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-6 text-right text-muted-foreground">{d.safety_score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${statusColors[d.status]}`}>
                        {d.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.status === 'pending_approval' && user?.role === 'fleet_manager' ? (
                        <Button 
                          onClick={() => approveDriver(d.id)}
                          disabled={approving === d.id}
                          className="h-8 px-3 text-xs"
                        >
                          {approving === d.id ? 'Approving...' : 'Approve'}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddDriverModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchDrivers} 
      />
    </div>
  )
}
