import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const date = dateParam ? new Date(dateParam) : new Date()

    const nutrition = await mealService.getDailyNutrition(session.user.id, date)

    return NextResponse.json(nutrition)
  } catch (error) {
    console.error('Error fetching daily nutrition:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily nutrition' },
      { status: 500 }
    )
  }
}