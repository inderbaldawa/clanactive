import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, signInAnonymously, signInWithPopup, GoogleAuthProvider } from './lib/firebase';
import { handleFirestoreError } from './lib/error-handling';
import { UserProfile } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Workouts from './components/Workouts';
import Groups from './components/Groups';
import Leaderboard from './components/Leaderboard';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [entryName, setEntryName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        
        // Setup profile listener
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Profile Healing: Ensure required fields exist for legacy/broken accounts
            if (data.totalWorkouts === undefined || data.currentStreak === undefined) {
              const repair = {
                totalWorkouts: data.totalWorkouts ?? 0,
                currentStreak: data.currentStreak ?? 0,
                displayName: data.displayName || 'Athlete',
                uid: u.uid
              };
              await setDoc(userRef, repair, { merge: true });
              setProfile({ ...data, ...repair } as UserProfile);
            } else {
              setProfile(data as UserProfile);
            }
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, 'get', `users/${u.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryName.trim()) return;

    setIsJoining(true);
    try {
      const { user: u } = await signInAnonymously(auth);
      const userRef = doc(db, 'users', u.uid);
      
      const newProfile: UserProfile = {
        uid: u.uid,
        displayName: entryName.trim(),
        currentStreak: 0,
        totalWorkouts: 0
      };

      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp()
      });
      
      setProfile(newProfile);
    } catch (err) {
      console.error("Error joining:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoogleJoin = async () => {
    setIsJoining(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user: u } = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', u.uid);
      
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: u.uid,
          displayName: u.displayName || 'Athlete',
          photoURL: u.photoURL || undefined,
          currentStreak: 0,
          totalWorkouts: 0
        };

        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp()
        });
        setProfile(newProfile);
      }
    } catch (err) {
      console.error("Error joining with Google:", err);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full bg-surface border border-outline p-10 rounded-[16px] shadow-sm"
        >
          <div className="w-10 h-10 bg-primary rounded-[6px] mx-auto mb-6"></div>
          <h1 className="font-body font-bold text-2xl text-on-surface mb-2 tracking-tight uppercase">ClanActive</h1>
          <p className="text-on-surface-variant mb-8 font-body text-sm leading-relaxed">Enter your athlete name to begin your consistency journey.</p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text"
              placeholder="Your Athlete Name"
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              className="w-full bg-slate-50 border border-outline rounded-lg p-4 text-sm focus:ring-1 focus:ring-primary outline-none text-center font-bold"
              required
            />
            <button 
              type="submit"
              disabled={isJoining || !entryName.trim()}
              className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-dim text-white py-4 rounded-lg font-bold transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Join Anonymous
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-surface px-4 text-on-surface-variant">Or social login</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleJoin}
            disabled={isJoining}
            className="w-full flex items-center justify-center gap-3 bg-white border border-outline hover:bg-slate-50 text-on-surface py-3 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard profile={profile} />;
      case 'workouts': return <Workouts profile={profile} onRefresh={() => {}} />;
      case 'groups': return <Groups profile={profile} />;
      case 'leaderboard': return <Leaderboard profile={profile} />;
      default: return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      
      <main className="flex-1 lg:ml-60 pt-12 px-6 md:px-12 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl border-t border-outline h-20 flex justify-around items-center px-4 z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">grid_view</span>
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button onClick={() => setActiveTab('workouts')} className={`flex flex-col items-center gap-1 ${activeTab === 'workouts' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">fitness_center</span>
          <span className="text-[10px] font-bold">Activity</span>
        </button>
        <button onClick={() => setActiveTab('groups')} className={`flex flex-col items-center gap-1 ${activeTab === 'groups' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">group</span>
          <span className="text-[10px] font-bold">Clans</span>
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'leaderboard' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">military_tech</span>
          <span className="text-[10px] font-bold">Leaderboard</span>
        </button>
      </nav>
    </div>
  );
}
