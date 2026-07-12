'use client'

import { useEffect, useState } from 'react'
import { Settings, Shield, Building2, Wallet, Users, KeyRound, Globe, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type RoleMatrix = {
  role: string
  displayName: string
  description: string
  permissions: {
    fleet: boolean
    drivers: boolean
    trips: boolean
    finance: boolean
    analytics: boolean
    settings: boolean
  }
}

const defaultRoles: RoleMatrix[] = [
  {
    role: 'fleet_manager',
    displayName: 'Fleet Manager',
    description: 'Owns the vehicle fleet, maintenance schedule, and overarching business metrics.',
    permissions: { fleet: true, drivers: true, trips: true, finance: true, analytics: true, settings: true }
  },
  {
    role: 'dispatcher',
    displayName: 'Dispatcher',
    description: 'Owns trip planning and dispatching. Tracks live trip status.',
    permissions: { fleet: false, drivers: false, trips: true, finance: false, analytics: false, settings: false }
  },
  {
    role: 'safety_officer',
    displayName: 'Safety Officer',
    description: 'Owns driver compliance. Triggers DigiLocker verifications.',
    permissions: { fleet: false, drivers: true, trips: true /* View Only */, finance: false, analytics: false, settings: false }
  },
  {
    role: 'financial_analyst',
    displayName: 'Financial Analyst',
    description: 'Owns cost reporting. Logs fuel and operational expenses.',
    permissions: { fleet: false, drivers: false, trips: false, finance: true, analytics: true, settings: false }
  }
]

export default function SettingsPage() {
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user) })
      .catch(console.error)
  }, [])

  if (user && user.role !== 'fleet_manager') {
    return (
      <div className="p-8 h-screen flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <Shield className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-100">Access Denied</h1>
        <p className="text-muted-foreground mt-2">
          Only the Fleet Manager can access the Settings and RBAC configuration page.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings & RBAC
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure global platform settings and review role-based access matrix.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="general">General Configuration</TabsTrigger>
          <TabsTrigger value="rbac">Roles & Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-400">
                  <Building2 className="w-5 h-5" />
                  Organization Details
                </CardTitle>
                <CardDescription>Basic information about your transport company.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Company Name</label>
                  <input type="text" defaultValue="TransitOps Logistics" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Primary Depot Location</label>
                  <input type="text" defaultValue="Mumbai, Maharashtra" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
                  <Globe className="w-5 h-5" />
                  Localization & Formats
                </CardTitle>
                <CardDescription>Regional settings and currency formats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Base Currency</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none">
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Distance Unit</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none">
                    <option>Kilometers (km)</option>
                    <option>Miles (mi)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            
            <div className="col-span-1 md:col-span-2 flex justify-end">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="rbac" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <KeyRound className="w-5 h-5" />
                Role-Based Access Control (RBAC) Matrix
              </CardTitle>
              <CardDescription>
                Overview of system roles and their assigned module permissions. Modifying permissions requires super-admin access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-slate-900/50 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium text-center">Fleet</th>
                      <th className="px-4 py-3 font-medium text-center">Drivers</th>
                      <th className="px-4 py-3 font-medium text-center">Trips</th>
                      <th className="px-4 py-3 font-medium text-center">Finance</th>
                      <th className="px-4 py-3 font-medium text-center">Analytics</th>
                      <th className="px-4 py-3 font-medium text-center">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {defaultRoles.map((r) => (
                      <tr key={r.role} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-200">{r.displayName}</div>
                          <div className="text-xs text-slate-500 mt-1 max-w-xs">{r.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {r.permissions.fleet ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {r.permissions.drivers ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {r.permissions.trips ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {r.permissions.finance ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {r.permissions.analytics ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {r.permissions.settings ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
