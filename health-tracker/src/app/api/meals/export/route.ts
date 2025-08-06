import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const format = searchParams.get('format') || 'csv'
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = subDays(new Date(), days)
    const endDate = new Date()
    
    const meals = await mealService.getMealLogs(session.user.id, startDate, endDate)

    if (format === 'csv') {
      const csv = generateCSV(meals)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="meals-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json(meals)
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error exporting meals:', error)
    return NextResponse.json(
      { error: 'Failed to export meals' },
      { status: 500 }
    )
  }
}

function generateCSV(meals: any[]): string {
  const headers = [
    'Date',
    'Time',
    'Meal Type',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
    'Fiber (g)',
    'Food Items',
    'Notes'
  ]

  const rows = meals.map(meal => {
    const date = new Date(meal.loggedAt)
    const foodItems = meal.foodItems
      ?.map((item: any) => `${item.foodItem.name} (${item.quantity}x)`)
      .join('; ') || ''
    
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      meal.mealType,
      meal.totalCalories || 0,
      meal.totalProtein || 0,
      meal.totalCarbs || 0,
      meal.totalFat || 0,
      meal.totalFiber || 0,
      foodItems,
      meal.notes || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}