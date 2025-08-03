import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, format, differenceInHours } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const dataTypes = searchParams.get('dataTypes')?.split(',') || ['all']
    const exportFormat = searchParams.get('format') || 'json'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const shouldInclude = (type: string) => 
      dataTypes.includes('all') || dataTypes.includes(type)

    // Fetch requested data
    const data: any = {
      exportDate: new Date().toISOString(),
      period: {
        start: startDate,
        end: endDate,
      },
      user: {
        name: user.name,
        email: user.email,
      },
    }

    // Weight data
    if (shouldInclude('weight')) {
      const weightRecords = await prisma.weightRecord.findMany({
        where: {
          userId: user.id,
          recordedAt: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        },
        orderBy: { recordedAt: 'asc' },
      })

      data.weight = weightRecords.map(record => ({
        date: format(record.recordedAt, 'yyyy-MM-dd'),
        time: format(record.recordedAt, 'HH:mm:ss'),
        weight: record.weight,
        notes: record.notes,
      }))
    }

    // Fasting data
    if (shouldInclude('fasting')) {
      const fastingSessions = await prisma.fastingSession.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        },
        orderBy: { startTime: 'asc' },
      })

      data.fasting = fastingSessions.map(session => ({
        startDate: format(session.startTime, 'yyyy-MM-dd'),
        startTime: format(session.startTime, 'HH:mm:ss'),
        endDate: session.endTime ? format(session.endTime, 'yyyy-MM-dd') : null,
        endTime: session.endTime ? format(session.endTime, 'HH:mm:ss') : null,
        type: session.type,
        targetHours: session.targetHours,
        actualHours: session.endTime 
          ? differenceInHours(session.endTime, session.startTime) 
          : null,
        status: session.status,
        notes: session.notes,
      }))
    }

    // Health metrics data
    if (shouldInclude('health')) {
      const healthMetrics = await prisma.healthMetric.findMany({
        where: {
          userId: user.id,
          recordedAt: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        },
        orderBy: { recordedAt: 'asc' },
      })

      data.health = healthMetrics.map(metric => ({
        date: format(metric.recordedAt, 'yyyy-MM-dd'),
        time: format(metric.recordedAt, 'HH:mm:ss'),
        type: metric.metricType,
        value: metric.value,
        unit: metric.unit,
        notes: metric.notes,
      }))
    }

    // Calculate summary statistics
    data.summary = {
      weightRecords: data.weight?.length || 0,
      fastingSessions: data.fasting?.length || 0,
      healthMetrics: data.health?.length || 0,
      fastingHours: data.fasting?.reduce((total: number, session: any) => 
        total + (session.actualHours || 0), 0
      ) || 0,
      avgWeight: data.weight?.length > 0
        ? data.weight.reduce((sum: number, r: any) => sum + r.weight, 0) / data.weight.length
        : 0,
      weightChange: data.weight?.length > 1
        ? data.weight[data.weight.length - 1].weight - data.weight[0].weight
        : 0,
    }

    // Format based on requested format
    if (exportFormat === 'csv') {
      // Generate CSV for each data type
      const csvData: any = {}
      
      if (data.weight) {
        csvData.weight = convertToCSV(data.weight, ['date', 'time', 'weight', 'notes'])
      }
      
      if (data.fasting) {
        csvData.fasting = convertToCSV(data.fasting, [
          'startDate', 'startTime', 'endDate', 'endTime', 
          'type', 'targetHours', 'actualHours', 'status', 'notes'
        ])
      }
      
      if (data.health) {
        csvData.health = convertToCSV(data.health, [
          'date', 'time', 'type', 'value', 'unit', 'notes'
        ])
      }

      // Combine all CSV data
      let combinedCSV = ''
      
      if (csvData.weight) {
        combinedCSV += 'WEIGHT RECORDS\n' + csvData.weight + '\n\n'
      }
      
      if (csvData.fasting) {
        combinedCSV += 'FASTING SESSIONS\n' + csvData.fasting + '\n\n'
      }
      
      if (csvData.health) {
        combinedCSV += 'HEALTH METRICS\n' + csvData.health + '\n\n'
      }

      return NextResponse.json({ csv: combinedCSV, ...data })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any[], columns: string[]): string {
  if (!data || data.length === 0) return ''

  // Create header
  const header = columns.join(',')
  
  // Create rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col]
      // Handle special cases
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`
      return value
    }).join(',')
  )

  return [header, ...rows].join('\n')
}