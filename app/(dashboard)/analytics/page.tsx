'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p>Generating Reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Historical performance and cost analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
              6-Month Revenue Trend
            </CardTitle>
            <CardDescription>Total revenue generated from completed trips.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.revenueByMonth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Line type="monotone" dataKey="total_revenue" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              Costliest Vehicles (Fuel + Maintenance)
            </CardTitle>
            <CardDescription>Top 5 vehicles by combined historical costs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.costliestVehicles || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#fb7185' }}
                  />
                  <Bar dataKey="total_cost" fill="#fb7185" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
