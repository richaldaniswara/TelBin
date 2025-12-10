import React from 'react';
import { ArrowLeft, ChevronRight, User, Bell, LogOut, Settings, HelpCircle, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Scan {
  id: number;
  type: string;
}

interface ProfileProps {
  onLogout: () => void;
  scanHistory: Scan[];
  userPoints: number;
}

export default function Profile({ onLogout, scanHistory, userPoints }: ProfileProps) {
  const navigate = useNavigate();

  const totalScans = scanHistory.length;
  
  const typeCounts = scanHistory.reduce((acc, scan) => {
    acc[scan.type] = (acc[scan.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const mostScanned = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  // Calculate earned medals
  const currentMedalLevel = Math.floor(userPoints / 1000);
  
  const allMedals = [
    { 
      level: 1, 
      emoji: '🥉', 
      title: 'Bronze Eco Champion', 
      points: 1000,
      color: 'from-amber-600 to-amber-400',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    { 
      level: 2, 
      emoji: '🥈', 
      title: 'Silver Eco Champion', 
      points: 2000,
      color: 'from-gray-400 to-gray-300',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    { 
      level: 3, 
      emoji: '🥇', 
      title: 'Gold Eco Champion', 
      points: 3000,
      color: 'from-yellow-500 to-yellow-300',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    { 
      level: 4, 
      emoji: '💎', 
      title: 'Platinum Eco Champion', 
      points: 4000,
      color: 'from-cyan-500 to-blue-400',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    },
    { 
      level: 5, 
      emoji: '🏆', 
      title: 'Diamond Eco Champion', 
      points: 5000,
      color: 'from-purple-500 to-pink-400',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const menuItems = [
    { icon: User, label: 'Edit Profile', action: () => {} },
    { icon: Bell, label: 'Notifications', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => {} },
    { icon: Shield, label: 'Privacy Policy', action: () => {} },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} },
    { icon: LogOut, label: 'Logout', action: onLogout, danger: true }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-green-50 to-white px-6 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-gray-800">Profile</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#34A853] rounded-full flex items-center justify-center text-white text-4xl mb-4 shadow-lg">
            👤
          </div>
          <h2 className="text-gray-800 mb-1">Eco Warrior</h2>
          <p className="text-gray-500">warrior@telbin.app</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-[#34A853] mb-1">{totalScans}</div>
            <p className="text-gray-500">Scans</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-[#34A853] mb-1">{mostScanned ? mostScanned[1] : 0}</div>
            <p className="text-gray-500">Best</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-[#34A853] mb-1">{totalScans * 10}</div>
            <p className="text-gray-500">Points</p>
          </div>
        </div>

        {mostScanned && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 mb-1">Most Scanned Type</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {mostScanned[0] === 'plastic' ? '♻️' :
                     mostScanned[0] === 'glass' ? '🍾' :
                     mostScanned[0] === 'metal' ? '🥫' :
                     mostScanned[0] === 'paper' ? '📄' : '🌿'}
                  </span>
                  <span className="text-gray-800 capitalize">{mostScanned[0]}</span>
                </div>
              </div>
              <div className="text-[#34A853]">{mostScanned[1]} items</div>
            </div>
          </div>
        )}

        {/* Medals Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800">Achievements</h3>
            <div className="text-gray-500">{currentMedalLevel}/{allMedals.length}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {allMedals.map((medal) => {
              const isEarned = currentMedalLevel >= medal.level;
              
              return (
                <div
                  key={medal.level}
                  className={`rounded-2xl p-4 text-center transition-all ${
                    isEarned
                      ? `${medal.bgColor} border-2 ${medal.borderColor} shadow-sm`
                      : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                  }`}
                >
                  <div className="relative mb-2">
                    <div className="text-4xl">{medal.emoji}</div>
                    {!isEarned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mb-1 ${isEarned ? 'text-gray-700' : 'text-gray-400'}`}>
                    {medal.title}
                  </p>
                  <p className={`text-xs ${isEarned ? 'text-[#34A853]' : 'text-gray-400'}`}>
                    {isEarned ? '✓ Unlocked' : `${medal.points} pts`}
                  </p>
                </div>
              );
            })}
          </div>
          
          {currentMedalLevel < allMedals.length && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700">Next Medal Progress</p>
                <p className="text-xs text-gray-500">
                  {userPoints} / {allMedals[currentMedalLevel].points}
                </p>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#34A853] transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${Math.min((userPoints / allMedals[currentMedalLevel].points) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
          
          {currentMedalLevel >= allMedals.length && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <p className="text-center text-purple-700">🎉 All medals unlocked!</p>
              <p className="text-center text-xs text-purple-600 mt-1">You're a true Eco Champion!</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors ${
                item.danger ? 'text-red-500' : 'text-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-gray-600'}`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-1">TelBin v1.0.0</p>
          <p className="text-gray-400">Making Earth cleaner, one scan at a time 🌍</p>
        </div>
      </div>
    </div>
  );
}
