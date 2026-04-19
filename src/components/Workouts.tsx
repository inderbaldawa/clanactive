import React, { useState, useEffect } from 'react';
import { UserProfile, BodyPart, WorkoutRecord } from '../types';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/error-handling';
import { motion } from 'motion/react';
import { 
  Dumbbell, 
  Clock, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface WorkoutsProps {
  profile: UserProfile | null;
  onRefresh: () => void;
}

const bodyParts: BodyPart[] = ['Legs', 'Shoulders', 'Chest', 'Arms', 'Back'];

export default function Workouts({ profile, onRefresh }: WorkoutsProps) {
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState(8.5);
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [view, setView] = useState<'personal' | 'community'>('personal');

  useEffect(() => {
    if (!profile) return;
    const baseQuery = collection(db, 'workouts');
    const q = view === 'personal'
      ? query(baseQuery, where('userId', '==', profile.uid), orderBy('createdAt', 'desc'))
      : query(baseQuery, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutRecord)));
    }, (error) => {
      handleFirestoreError(error, 'list', 'workouts');
    });
    return unsubscribe;
  }, [profile, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedPart) return;

    setLoading(true);
    try {
      const workoutData = {
        userId: profile.uid,
        userName: profile.displayName,
        bodyPart: selectedPart,
        duration,
        intensity,
        notes,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'workouts'), workoutData);
      
      const userRef = doc(db, 'users', profile.uid);
      
      // Calculate new streak based on profile data
      let newStreakValue = profile.currentStreak || 0;
      const lastWorkoutDateObj = profile.lastWorkoutDate;
      const lastDate = lastWorkoutDateObj?.toDate ? lastWorkoutDateObj.toDate() : null;

      if (!lastDate) {
        newStreakValue = 1;
      } else if (isToday(lastDate)) {
        newStreakValue = profile.currentStreak || 1;
      } else if (isYesterday(lastDate)) {
        newStreakValue = (profile.currentStreak || 0) + 1;
      } else {
        newStreakValue = 1;
      }

      await updateDoc(userRef, {
        totalWorkouts: increment(1),
        currentStreak: newStreakValue,
        lastWorkoutDate: serverTimestamp()
      }).catch(err => handleFirestoreError(err, 'update', `users/${profile.uid}`));

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedPart(null);
        setNotes('');
      }, 3000);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && !err.message.startsWith('{')) {
        handleFirestoreError(err, 'create', 'workouts');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-body text-sm font-bold text-on-surface-variant uppercase tracking-widest">Activity Journal</h2>
        <div className="flex bg-slate-50 border border-outline rounded-lg p-1">
          <button 
            onClick={() => setView('personal')}
            className={`px-4 py-2 text-[11px] font-bold uppercase rounded-md transition-all ${view === 'personal' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            My Activity
          </button>
          <button 
            onClick={() => setView('community')}
            className={`px-4 py-2 text-[11px] font-bold uppercase rounded-md transition-all ${view === 'community' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Community
          </button>
        </div>
      </div>

      <div className="geometric-card mb-12">
        <div className="font-body text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">
          Record Today's Activity
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {bodyParts.map((part) => (
            <button
              key={part}
              onClick={() => setSelectedPart(part)}
              className={`py-4 rounded-lg font-body text-[13px] font-semibold text-center cursor-pointer transition-all border-2 ${
                selectedPart === part 
                ? 'border-primary bg-primary text-white shadow-md' 
                : 'border-slate-50 bg-slate-50 text-on-surface-variant hover:border-primary/40'
              }`}
            >
              {part}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Duration (min)</label>
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-50 border border-outline rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
            />
          </div>
          <div>
            <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Intensity (1-10)</label>
            <input 
              type="number" 
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full bg-slate-50 border border-outline rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || !selectedPart || isSuccess}
          className={`mt-6 w-full py-4 text-white font-bold rounded-lg transition-all active:scale-[0.98] ${
            isSuccess ? 'bg-tertiary' : 'bg-primary shadow-lg shadow-primary/20 hover:bg-primary-dim'
          }`}
        >
          {loading ? 'Saving...' : isSuccess ? 'Record Saved' : 'Save Record'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.map((workout) => (
          <div key={workout.id} className="geometric-card">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                {workout.bodyPart}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                {workout.createdAt?.seconds ? format(new Date(workout.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}
              </span>
            </div>
            <div className="text-sm font-body text-on-surface leading-snug mb-3">
              {workout.notes || 'Intense session recorded.'}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workout.userId}`} 
                  className="w-full h-full object-cover" 
                  alt="avatar" 
                />
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
                Athlete: {workout.userName || 'Anonymous'}
              </span>
            </div>
            <div className="mt-auto flex gap-4 text-xs font-bold text-on-surface-variant uppercase tracking-tighter pt-4 border-t border-slate-50">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{workout.duration}m</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3"/>Intensity {workout.intensity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
