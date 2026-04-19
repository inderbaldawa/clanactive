export type BodyPart = 'Legs' | 'Shoulders' | 'Chest' | 'Arms' | 'Back';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  currentStreak: number;
  lastWorkoutDate?: any; // Firestore Timestamp
  totalWorkouts: number;
}

export interface Clan {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: any;
  avatar?: string;
}

export interface ClanMember {
  userId: string;
  groupId: string;
  joinedAt: any;
  weeklyPoints: number;
}

export interface WorkoutRecord {
  id?: string;
  userId: string;
  bodyPart: BodyPart;
  duration: number;
  intensity: number;
  notes?: string;
  createdAt: any;
}
