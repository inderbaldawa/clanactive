import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/error-handling';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Heart, ArrowRight } from 'lucide-react';

interface LeaderboardProps {
  profile: UserProfile | null;
}

export default function Leaderboard({ profile }: LeaderboardProps) {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalWorkouts', 'desc'), limit(25));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, 'list', 'users');
    });
    return unsubscribe;
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-body text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            Clan Leaderboard <span className="font-normal normal-case ml-2 text-xs">This Week</span>
          </h2>
        </div>
      </div>

      <div className="geometric-card">
        <div className="divide-y divide-outline">
          {topUsers.map((user, index) => (
            <div key={user.uid} className="flex items-center py-4 first:pt-0 last:pb-0">
              <span className="w-8 font-bold text-on-surface-variant text-sm">{index + 1}</span>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden mr-4 border border-outline">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  className="w-full h-full object-cover" 
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-on-surface">
                  {user.displayName} {user.uid === profile?.uid && '(You)'}
                </div>
                <div className="text-[11px] text-on-surface-variant font-bold">
                  {user.totalWorkouts || 0} Workouts • {user.currentStreak || 0} Day Streak
                </div>
              </div>
              <div className="w-20 h-[6px] bg-slate-100 rounded-full relative overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(((user.totalWorkouts || 0) / 20) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {topUsers.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant font-body text-sm">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
            The ladder is empty. Start competing.
          </div>
        )}
      </div>
    </div>
  );
}
