import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './components/Onboarding';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import CameraScan from './components/CameraScan';
import History from './components/History';
import Rewards from './components/Rewards';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import NotificationContainer, { NotificationItem } from './components/NotificationContainer';
import MedalSplash from './components/MedalSplash';
import MobileViewport from './components/MobileViewport';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [lastMedalPoints, setLastMedalPoints] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showMedalSplash, setShowMedalSplash] = useState(false);
  const [medalLevel, setMedalLevel] = useState(1);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
      category: 'Plastic Bottle',
      confidence: 94,
      points: 10,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'plastic'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400',
      category: 'Cardboard Box',
      confidence: 87,
      points: 10,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      type: 'paper'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400',
      category: 'Glass Bottle',
      confidence: 91,
      points: 10,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      type: 'glass'
    }
  ]);

  useEffect(() => {
    const seenOnboarding = localStorage.getItem('telbin_onboarding');
    const savedPoints = localStorage.getItem('telbin_points');
    const savedLastMedal = localStorage.getItem('telbin_last_medal');
    const savedClaimedRewards = localStorage.getItem('telbin_claimed_rewards');

    if (seenOnboarding) setHasSeenOnboarding(true);
    if (savedPoints) setUserPoints(parseInt(savedPoints));
    if (savedLastMedal) setLastMedalPoints(parseInt(savedLastMedal));
    if (savedClaimedRewards) setClaimedRewards(JSON.parse(savedClaimedRewards));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);


  // Check for medal milestones and save points
  useEffect(() => {
    if (userPoints > 0 && lastMedalPoints >= 0) {
      const currentMilestone = Math.floor(userPoints / 1000);
      const lastMilestone = Math.floor(lastMedalPoints / 1000);
      
      if (currentMilestone > lastMilestone && currentMilestone > 0) {
        setMedalLevel(currentMilestone);
        setShowMedalSplash(true);
        setLastMedalPoints(userPoints);
        localStorage.setItem('telbin_last_medal', userPoints.toString());
      }
    }
    
    localStorage.setItem('telbin_points', userPoints.toString());
  }, [userPoints, lastMedalPoints]);

  // Save claimed rewards to localStorage
  useEffect(() => {
    localStorage.setItem('telbin_claimed_rewards', JSON.stringify(claimedRewards));
  }, [claimedRewards]);

  const completeOnboarding = () => {
    localStorage.setItem('telbin_onboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    // ✅ Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addScan = (scan: any) => {
    const newScan = {
      ...scan,
      id: scanHistory.length + 1,
      timestamp: new Date()
    };
    setScanHistory([newScan, ...scanHistory]);
    setUserPoints(userPoints + scan.points);
    addNotification(`🎉 Earned ${scan.points} points for ${scan.category}!`, 'success');
  };

  const handleClaimReward = (rewardId: number, rewardName: string, bonusPoints: number) => {
    if (!claimedRewards.includes(rewardId)) {
      setClaimedRewards([...claimedRewards, rewardId]);
      setUserPoints(userPoints + bonusPoints);
      addNotification(`🎁 Claimed ${rewardName}! (+${bonusPoints} bonus points)`, 'success');
    }
  };

  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (!isLoggedIn) {
    return <LoginRegister onLogin={handleLogin} />;
  }

  return (
    <MobileViewport>
      <Router>
        <div className="min-h-screen bg-white pb-20">
          <Routes>
            <Route path="/" element={<Dashboard userPoints={userPoints} scanHistory={scanHistory} />} />
            <Route path="/scan" element={<CameraScan onScanComplete={addScan} />} />
            <Route path="/history" element={<History scanHistory={scanHistory} />} />
            <Route path="/rewards" element={<Rewards userPoints={userPoints} scanHistory={scanHistory} claimedRewards={claimedRewards} onClaimReward={handleClaimReward} />} />
            <Route path="/profile" element={<Profile onLogout={handleLogout} scanHistory={scanHistory} userPoints={userPoints} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
          
          <NotificationContainer 
            notifications={notifications}
            onRemove={removeNotification}
          />
          
          {showMedalSplash && (
            <MedalSplash 
              medalLevel={medalLevel}
              onClose={() => setShowMedalSplash(false)}
            />
          )}
        </div>
      </Router>
    </MobileViewport>
  );
}
