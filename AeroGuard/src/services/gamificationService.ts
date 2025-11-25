// Gamification System for User Engagement
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'health' | 'environment' | 'community' | 'education';
  points: number;
  unlocked: boolean;
  unlockedDate?: Date;
  progress: number; // 0-100
  requirements: AchievementRequirement[];
}

export interface AchievementRequirement {
  type: 'days_tracked' | 'clean_routes_taken' | 'data_shared' | 'health_profile_complete';
  target: number;
  current: number;
}

export interface UserStats {
  totalPoints: number;
  level: number;
  daysTracked: number;
  cleanRoutesToken: number;
  dataPointsShared: number;
  co2Saved: number; // kg
  healthyDaysCount: number;
  achievements: Achievement[];
  weeklyStreak: number;
  monthlyStreak: number;
}

export class GamificationService {
  /**
   * Calculate user level based on points
   */
  static calculateUserLevel(points: number): { level: number; pointsToNext: number } {
    const basePoints = 100;
    const level = Math.floor(Math.log2(points / basePoints + 1)) + 1;
    const pointsToNext = basePoints * Math.pow(2, level) - points;
    
    return { level, pointsToNext };
  }

  /**
   * Check and unlock achievements
   */
  static checkAchievements(userStats: UserStats): Achievement[] {
    const newAchievements: Achievement[] = [];
    
    const achievementTemplates: Partial<Achievement>[] = [
      {
        id: 'first_week',
        title: 'First Week Warrior',
        description: 'Track air quality for 7 consecutive days',
        icon: '🏆',
        category: 'health',
        points: 100,
        requirements: [{ type: 'days_tracked', target: 7, current: userStats.daysTracked }]
      },
      {
        id: 'clean_route_champion',
        title: 'Clean Route Champion',
        description: 'Take 25 clean routes',
        icon: '🌿',
        category: 'environment',
        points: 250,
        requirements: [{ type: 'clean_routes_taken', target: 25, current: userStats.cleanRoutesToken }]
      },
      {
        id: 'data_contributor',
        title: 'Data Contributor',
        description: 'Share 100 data points with the community',
        icon: '📊',
        category: 'community',
        points: 200,
        requirements: [{ type: 'data_shared', target: 100, current: userStats.dataPointsShared }]
      },
      {
        id: 'health_guardian',
        title: 'Health Guardian',
        description: 'Complete your health profile',
        icon: '🛡️',
        category: 'health',
        points: 150,
        requirements: [{ type: 'health_profile_complete', target: 1, current: 1 }]
      }
    ];

    achievementTemplates.forEach(template => {
      const isUnlocked = template.requirements?.every(req => req.current >= req.target) || false;
      const existingAchievement = userStats.achievements.find(a => a.id === template.id);
      
      if (isUnlocked && !existingAchievement?.unlocked) {
        newAchievements.push({
          ...template,
          unlocked: true,
          unlockedDate: new Date(),
          progress: 100,
          requirements: template.requirements || []
        } as Achievement);
      }
    });

    return newAchievements;
  }

  /**
   * Calculate environmental impact
   */
  static calculateEnvironmentalImpact(cleanRoutesToken: number): {
    co2Saved: number;
    treesEquivalent: number;
    cleanMilesWalked: number;
  } {
    const avgCO2PerRoute = 0.5; // kg CO2 saved per clean route
    const co2Saved = cleanRoutesToken * avgCO2PerRoute;
    const treesEquivalent = Math.floor(co2Saved / 21.77); // kg CO2 absorbed per tree per year
    const cleanMilesWalked = cleanRoutesToken * 2.5; // average miles per route

    return { co2Saved, treesEquivalent, cleanMilesWalked };
  }

  /**
   * Generate personalized challenges
   */
  static generateWeeklyChallenges(userStats: UserStats): Array<{
    id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    reward: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }> {
    return [
      {
        id: 'weekly_tracking',
        title: 'Daily Tracker',
        description: 'Check AQI every day this week',
        target: 7,
        current: userStats.weeklyStreak,
        reward: 100,
        difficulty: 'easy'
      },
      {
        id: 'clean_commute',
        title: 'Clean Commuter',
        description: 'Take 5 clean routes this week',
        target: 5,
        current: 0,
        reward: 200,
        difficulty: 'medium'
      },
      {
        id: 'community_hero',
        title: 'Community Hero',
        description: 'Share 20 data points with community',
        target: 20,
        current: 0,
        reward: 300,
        difficulty: 'hard'
      }
    ];
  }
}