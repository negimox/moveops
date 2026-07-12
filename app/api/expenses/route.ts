import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getExpenses, createExpense } from '@/lib/queries/finance'

export async function GET() {
  try {
    const user = await getCurrentUser()
    // Accessible by Financial Analyst and Fleet Manager
    requireRole(user, 'financial_analyst', 'fleet_manager')

    const expenses = await getExpenses()
    return NextResponse.json({ expenses })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    // Only Financial Analyst can log expenses
    requireRole(user, 'financial_analyst')

    const data = await request.json()

    if (!data.category || !data.amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await createExpense({
      ...data,
      logged_by: user.id
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
