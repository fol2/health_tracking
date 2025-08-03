import { PrismaClient } from '@prisma/client'
import { hash } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test user (only for development)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: new Date(),
      profile: {
        create: {
          height: 175,
          targetWeight: 70,
          timezone: 'Asia/Hong_Kong',
          unitsPreference: 'metric',
          dateOfBirth: new Date('1990-01-01'),
        },
      },
    },
  })

  console.log(`✅ Created test user: ${testUser.email}`)

  // Add some sample data
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Add weight records
  const weights = [
    { weight: 75.5, recordedAt: twoWeeksAgo },
    { weight: 74.8, recordedAt: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000) },
    { weight: 74.2, recordedAt: oneWeekAgo },
    { weight: 73.5, recordedAt: new Date(oneWeekAgo.getTime() + 3 * 24 * 60 * 60 * 1000) },
    { weight: 73.0, recordedAt: now },
  ]

  for (const weight of weights) {
    await prisma.weightRecord.create({
      data: {
        userId: testUser.id,
        ...weight,
      },
    })
  }

  console.log(`✅ Created ${weights.length} weight records`)

  // Add fasting sessions
  const fastingSessions = [
    {
      startTime: new Date(twoWeeksAgo.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      endTime: new Date(twoWeeksAgo.getTime() + 24 * 60 * 60 * 1000), // Next day
      type: '16:8',
      targetHours: 16,
      status: 'completed',
    },
    {
      startTime: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000),
      endTime: new Date(oneWeekAgo.getTime() + 26 * 60 * 60 * 1000),
      type: '18:6',
      targetHours: 18,
      status: 'completed',
    },
    {
      startTime: new Date(now.getTime() - 14 * 60 * 60 * 1000), // 14 hours ago
      endTime: null,
      type: '16:8',
      targetHours: 16,
      status: 'active',
    },
  ]

  for (const session of fastingSessions) {
    await prisma.fastingSession.create({
      data: {
        userId: testUser.id,
        ...session,
      },
    })
  }

  console.log(`✅ Created ${fastingSessions.length} fasting sessions`)

  // Add health metrics
  const healthMetrics = [
    {
      metricType: 'blood_pressure',
      value: { systolic: 120, diastolic: 80 },
      unit: 'mmHg',
      recordedAt: oneWeekAgo,
    },
    {
      metricType: 'heart_rate',
      value: 72,
      unit: 'bpm',
      recordedAt: oneWeekAgo,
    },
    {
      metricType: 'blood_glucose',
      value: 95,
      unit: 'mg/dL',
      recordedAt: now,
    },
  ]

  for (const metric of healthMetrics) {
    await prisma.healthMetric.create({
      data: {
        userId: testUser.id,
        ...metric,
      },
    })
  }

  console.log(`✅ Created ${healthMetrics.length} health metrics`)

  // Add scheduled fasts
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  tomorrow.setHours(8, 0, 0, 0)

  const scheduledFast = await prisma.scheduledFast.create({
    data: {
      userId: testUser.id,
      scheduledStart: tomorrow,
      scheduledEnd: new Date(tomorrow.getTime() + 16 * 60 * 60 * 1000),
      type: '16:8',
      isRecurring: true,
      recurrencePattern: JSON.stringify({
        frequency: 'daily',
        interval: 1,
      }),
      reminderTime: 30, // 30 minutes before
    },
  })

  // Add reminder
  const reminderTime = new Date(tomorrow)
  reminderTime.setMinutes(reminderTime.getMinutes() - 30)

  await prisma.reminder.create({
    data: {
      userId: testUser.id,
      scheduledFastId: scheduledFast.id,
      reminderTime,
      type: 'fast_start',
    },
  })

  console.log('✅ Created scheduled fast with reminder')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })