import React from 'react';
import { UserProfile } from '../types';
import { auth } from '../lib/firebase';
import { LogOut, Home, Dumbbell, Users, Medal, User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile | null;
}

export default function Sidebar({ activeTab, setActiveTab, profile }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: 'grid_view' },
    { id: 'workouts', label: 'Workouts', icon: 'fitness_center' },
    { id: 'leaderboard', label: 'Leaderboard', icon: 'military_tech' },
    { id: 'groups', label: 'Clans', icon: 'group' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full hidden lg:flex flex-col bg-surface-dim border-r border-outline w-60 z-40 pt-12">
      <div className="px-6 mb-12 flex items-center gap-3">
        <div className="w-6 h-6 bg-primary rounded-[4px]"></div>
        <h2 className="text-white font-body font-extrabold tracking-tight text-xl uppercase">CLANACTIVE</h2>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 py-3 px-6 font-body text-sm transition-all group ${
              activeTab === item.id 
              ? 'text-white font-semibold' 
              : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${activeTab === item.id ? 'fill-1 text-white' : 'text-[#9ca3af]'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
            <img 
              src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              alt="Profile"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-on-surface truncate">{profile?.displayName}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-70">Athlete</p>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => setActiveTab('workouts')}
          className="w-full py-4 bg-primary text-on-primary font-['Lexend'] font-bold rounded-xl active:scale-95 transition-transform uppercase tracking-tighter shadow-lg shadow-primary/20"
        >
          LOG WORKOUT
        </button>
      </div>
    </aside>
  );
}
