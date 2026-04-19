import React, { useState, useEffect } from 'react';
import { UserProfile, Clan } from '../types';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/error-handling';
import { Plus, Users, Shield, ArrowRight, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GroupsProps {
  profile: UserProfile | null;
}

export default function Groups({ profile }: GroupsProps) {
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClans, setMyClans] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanDesc, setNewClanDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan)));
    }, (error) => {
      handleFirestoreError(error, 'list', 'groups');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, `users/${profile.uid}/memberships`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyClans(snapshot.docs.map(doc => doc.id));
    }, (error) => {
      handleFirestoreError(error, 'list', `users/${profile.uid}/memberships`);
    });
    return unsubscribe;
  }, [profile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newClanName) return;
    setLoading(true);
    try {
      const clanData = {
        name: newClanName,
        description: newClanDesc,
        createdBy: profile.uid,
        createdAt: serverTimestamp(),
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${newClanName}`,
        memberCount: 1
      };
      const docRef = await addDoc(collection(db, 'groups'), clanData);
      await setDoc(doc(db, `users/${profile.uid}/memberships`, docRef.id), { joinedAt: serverTimestamp() });
      
      setShowCreate(false);
      setNewClanName('');
      setNewClanDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleJoin = async (clanId: string) => {
    if (!profile) return;
    const isMember = myClans.includes(clanId);
    try {
      const clanRef = doc(db, 'groups', clanId);
      const membershipRef = doc(db, `users/${profile.uid}/memberships`, clanId);

      if (isMember) {
        await deleteDoc(membershipRef);
        await updateDoc(clanRef, {
          memberCount: increment(-1)
        });
      } else {
        await setDoc(membershipRef, { joinedAt: serverTimestamp() });
        await updateDoc(clanRef, {
          memberCount: increment(1)
        });
      }
    } catch (err) {
      console.error("Join Error:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-body text-2xl font-bold text-on-surface">Clans</h1>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="text-[11px] px-4 py-2 rounded-md border border-outline bg-surface font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ Create'}
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="geometric-card mb-12"
          >
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Clan Name</label>
                <input 
                  type="text" 
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  className="w-full bg-slate-50 border border-outline rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  placeholder="Iron Legion"
                />
              </div>
              <button 
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dim transition-all"
              >
                {loading ? 'Processing...' : 'Save Clan'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {clans.map((clan) => (
          <div key={clan.id} className="geometric-card flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-slate-100 rounded-lg mr-4 overflow-hidden border border-outline">
                <img src={clan.avatar} className="w-full h-full object-cover" alt={clan.name} />
              </div>
              <div>
                <div className="font-bold text-sm text-on-surface">{clan.name}</div>
                <div className="text-[11px] text-on-surface-variant font-semibold">
                  {clan.memberCount || 1} Members • Active
                </div>
              </div>
            </div>
            <button 
              onClick={() => toggleJoin(clan.id)}
              className={`text-[11px] px-4 py-2 rounded-md border font-bold uppercase tracking-wider transition-all ${
                myClans.includes(clan.id)
                ? 'border-primary text-primary bg-primary/5'
                : 'border-outline text-on-surface-variant bg-surface hover:bg-slate-50'
              }`}
            >
              {myClans.includes(clan.id) ? 'Joined' : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
