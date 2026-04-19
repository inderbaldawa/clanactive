import React from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Flame, Star, Trophy, Medal } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile | null;
}

export default function Dashboard({ profile }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-on-surface-variant text-sm font-body">Welcome back, {profile?.displayName?.split(' ')[0]}</p>
          <h1 className="font-body text-3xl font-bold text-on-surface">Activity Dashboard</h1>
        </div>
        <div className="geometric-card min-w-[200px] py-4 flex flex-col justify-center">
          <div className="text-[48px] font-extrabold text-primary leading-none">
            {profile?.currentStreak || 0}
          </div>
          <div className="text-[12px] uppercase tracking-wider text-on-surface-variant mt-2 font-bold">
            Day Active Streak
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="geometric-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Total Workouts</p>
            <p className="text-xl font-bold">{profile?.totalWorkouts || 0}</p>
          </div>
        </div>
        <div className="geometric-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Achievements</p>
            <p className="text-xl font-bold">12</p>
          </div>
        </div>
        <div className="geometric-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Vault Level</p>
            <p className="text-xl font-bold">Lvl 14</p>
          </div>
        </div>
      </div>
    </div>
  );
}
