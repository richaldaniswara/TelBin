import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Award, Lightbulb } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Scan {
  id: number;
  image: string;
  category: string;
  confidence: number;
  points: number;
  timestamp: Date;
  type: string;
}

interface DashboardProps {
  userPoints: number;
  scanHistory: Scan[];
}

export default function Dashboard({ userPoints, scanHistory }: DashboardProps) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [totalPoints, setTotalPoints] = useState(0);

  const formatTime = (timestamp: string | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const tips = [
    'Rinse plastic bottles before disposing!',
    'Remove caps from bottles before recycling',
    'Cardboard should be flattened to save space',
    'Check local guidelines for e-waste disposal',
    'Organic waste can be composted at home'
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user || !user.email) return;

      const q = query(collection(db, "User"), where("email", "==", user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setFullName(data.fullName);
        setTotalPoints(data.totalPoints);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-green-50 to-white px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-800">
              Hello, {(!fullName || fullName === "Update your name") ? "Eco Warrior" : fullName}!
            </h1>
            <p className="text-gray-500">Let's make Earth cleaner today</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-12 h-12 bg-[#34A853] rounded-full flex items-center justify-center text-white"
          >
            👤
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg border border-green-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 mb-1">Your Points</p>
              <div className="flex items-center gap-2">
                <Award className="w-8 h-8 text-[#34A853]" />
                <span className="text-[#34A853]">{totalPoints}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/rewards')}
              className="bg-green-100 text-[#34A853] px-6 py-2 rounded-full hover:bg-green-200 transition-colors"
            >
              View Rewards
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/scan')}
          className="w-full bg-[#34A853] text-white rounded-3xl py-6 flex items-center justify-center gap-3 shadow-lg hover:bg-green-600 transition-colors"
        >
          <Camera className="w-6 h-6" />
          <span>Scan Trash</span>
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="bg-green-50 rounded-2xl p-4 flex gap-3 mb-6 border border-green-100">
          <Lightbulb className="w-6 h-6 text-[#34A853] flex-shrink-0" />
          <div>
            <p className="text-gray-600">💡 Tip of the day: {randomTip}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-800">Recent Classifications</h2>
          <button
            onClick={() => navigate('/history')}
            className="text-[#34A853]"
          >
            See All
          </button>
        </div>

        {scanHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400">No scans yet</p>
            <p className="text-gray-400">Start by scanning your first item!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scanHistory.slice(0, 3).map((scan) => (
              <div
                key={scan.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex gap-4 items-center hover:border-green-200 transition-colors"
              >
                <img
                  src={scan.image}
                  alt={scan.category}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-gray-800">{scan.category}</h3>
                  <p className="text-gray-500">Confidence: {scan.confidence}%</p>
                  <p className="text-gray-400">{formatTime(scan.timestamp)}</p>
                </div>
                <div className="text-[#34A853]">+{scan.points}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
