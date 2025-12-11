import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ChevronRight, LogOut,
  HelpCircle, Shield, Lock, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { awardMedalToUser } from '../services/awardMedal';

interface HistoryItem {
  type: string;
}
interface Medal {
  medalID: string;
  name: string;
  emoji: string;
  minPoints: number;
}
interface UserData {
  userId: string;
  email: string;
  nim: string;
  fullName: string;
  phoneNumber: string;
  medals: Medal[];
  history: HistoryItem[];
  totalPoints: number;
}

export default function Profile({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [allMedals, setMedals] = useState<Medal[]>([]);

  const [userData, setUserData] = useState<UserData | null>(null);

  const [editingField, setEditingField] = useState<null | 'fullName' | 'nim' | 'phoneNumber'>(null);
  const [editValue, setEditValue] = useState('');
  const [userDocId, setUserDocId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user?.email) return;

      const q = query(collection(db, 'User'), where('email', '==', user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as UserData;
        setUserData({
          ...data,
          medals: data.medals || [],       // default to empty array
          history: data.history || [],     // default to empty array
        });
        setUserDocId(snapshot.docs[0].id);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMedals = async () => {
      const snapshot = await getDocs(collection(db, "Medal"));
      const list: Medal[] = snapshot.docs.map(doc => ({
        medalID: doc.id,
        ...doc.data(),
      })) as Medal[];

      list.sort((a, b) => a.minPoints - b.minPoints);
      setMedals(list);
    };

    fetchMedals();
  }, []);

  useEffect(() => {
    if (!userData || allMedals.length === 0) return;

    const alreadyOwned = userData.medals.map(m => m.medalID) || [];

    // Find medals user has reached but not yet earned
    const newlyEarned = allMedals.filter(m =>
      userData.totalPoints >= m.minPoints && !alreadyOwned.includes(m.medalID)
    );

    if (newlyEarned.length > 0) {
      newlyEarned.forEach(async (medal) => {
        await awardMedalToUser(userDocId, medal);

        // Update local state UI immediately
        setUserData(prev =>
          prev
            ? { ...prev, medals: [...prev.medals, medal] }
            : prev
        );
      });
    }
  }, [userData, allMedals]);
  
  const handleSave = async () => {
    if (!editingField || !userDocId) return;

    try {
      setSaving(true);

      const ref = doc(db, 'User', userDocId);
      let valueToSave: any = editValue;

      if (editingField === 'nim' || editingField === 'phoneNumber') {
        if (!editValue) return;
        valueToSave = String(parseInt(editValue));
      }

      await updateDoc(ref, {
        [editingField]: valueToSave,
      });

      setUserData(prev =>
        prev ? { ...prev, [editingField]: valueToSave } : prev
      );

      setEditingField(null);
      setEditValue('');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  const userPoints = userData.totalPoints;
  const totalReports = userData?.history?.length || 0;

  const typeCounts = userData.history.reduce((acc, scan) => {
    acc[scan.type] = (acc[scan.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const mostScanned = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  const currentMedalLevel = allMedals.filter(m => userPoints >= m.minPoints).length || 0;  

  const highestMedal =
  [...allMedals].reverse().find(m => userPoints >= m.minPoints) || allMedals[0];

  const menuItems = [
    { icon: Shield, label: 'Privacy Policy', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: LogOut, label: 'Logout', action: onLogout, danger: true }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-green-50 to-white px-6 pt-12 pb-8">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-gray-800">Profile</h1>
        </div>

        {/* USER INFO */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#34A853] rounded-full flex items-center justify-center text-white text-4xl mb-4 shadow-lg">👤</div>

          <div className="flex items-center gap-2">
            <h2 className="text-gray-800">{userData.fullName}</h2>
            <Pencil onClick={() => { setEditingField('fullName'); setEditValue(userData.fullName); }}
              className="w-4 h-4 text-gray-400 cursor-pointer" />
          </div>

          <p className="text-gray-500">{userData.email}</p>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>NIM: {userData.nim}</span>
            <Pencil onClick={() => { setEditingField('nim'); setEditValue(userData.nim); }}
              className="w-4 h-4 cursor-pointer" />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <span>{userData.phoneNumber}</span>
            <Pencil onClick={() => { setEditingField('phoneNumber'); setEditValue(userData.phoneNumber); }}
              className="w-4 h-4 cursor-pointer" />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-[#34A853]">{totalReports}</div>
            <p className="text-gray-500">Reports</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-sm border-2 border-gray-200 bg-gray-50">
            <div className="text-3xl mb-1">{highestMedal?.emoji}</div>
            <p className="text-gray-700 text-sm">
              {highestMedal?.name}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-[#34A853]">{userPoints}</div>
            <p className="text-gray-500">Points</p>
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800">Achievements</h3>
            <div className="text-gray-500">{currentMedalLevel}/{allMedals.length}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {allMedals.map((medal) => {
              const isEarned = userPoints >= medal.minPoints;

              return (
                <div key={medal.level}
                  className={`rounded-2xl p-4 text-center ${
                    isEarned ? `${medal.bgColor} border-2 ${medal.borderColor}` : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                  }`}>
                  <div className="relative mb-2 text-4xl">
                    {medal.emoji}
                    {!isEarned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs">{medal.name}</p>
                  <p className="text-xs">{isEarned ? '✓ Unlocked' : `${medal.minPoints} pts`}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="px-6 py-6 space-y-2">
        {menuItems.map((item, index) => (
          <button key={index} onClick={item.action}
            className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 ${
              item.danger ? 'text-red-500' : 'text-gray-800'
            }`}>
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-600" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingField && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-sm rounded-2xl p-5 shadow-xl">
            <h3 className="text-gray-800 mb-4">
              Edit {editingField === 'fullName' ? 'Full Name' :
                    editingField === 'nim' ? 'NIM' : 'Phone Number'}
            </h3>

            <input
              type={editingField === 'fullName' ? 'text' : 'number'}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="w-full border rounded-xl p-3 text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setEditingField(null); setEditValue(''); }}
                className="flex-1 p-3 rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 p-3 rounded-xl bg-[#34A853] text-white disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
