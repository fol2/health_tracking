import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserService } from '@/lib/services/user.service'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profile = await UserService.getOrCreateProfile(session.user.id)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const profile = await UserService.updateProfile(session.user.id, data)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    // Update user name if provided
    if (data.name && data.name !== session.user.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: data.name }
      })
    }
    
    const profile = await UserService.updateProfile(session.user.id, data)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}