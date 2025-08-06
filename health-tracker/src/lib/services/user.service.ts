import { prisma } from '@/lib/db'
import type { UserProfile, Prisma } from '@prisma/client'

export class UserService {
  /**
   * Get or create user profile
   */
  static async getOrCreateProfile(userId: string): Promise<UserProfile> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (profile) {
      return profile
    }

    return prisma.userProfile.create({
      data: { userId },
    })
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserProfile> {
    return prisma.userProfile.upsert({
      where: { userId },
      update: data as Prisma.UserProfileUpdateInput,
      create: {
        user: { connect: { id: userId } },
        ...data,
      } as Prisma.UserProfileCreateInput,
    })
  }

  /**
   * Get user with profile
   */
  static async getUserWithProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })
  }
}