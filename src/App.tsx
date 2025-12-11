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
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // Load data from localStorage once
  useEffect(() => {
    const seenOnboarding = localStorage.getItem('telbin_onboarding');
    const savedPoints = localStorage.getItem('telbin_points');
    const savedLastMedal = localStorage.getItem('telbin_last_medal');
    const savedClaimedRewards = localStorage.getItem('telbin_claimed_rewards');
    const savedHistory = localStorage.getItem('telbin_scan_history');

    if (seenOnboarding) setHasSeenOnboarding(true);
    if (savedPoints) setUserPoints(parseInt(savedPoints));
    if (savedLastMedal) setLastMedalPoints(parseInt(savedLastMedal));
    if (savedClaimedRewards) setClaimedRewards(JSON.parse(savedClaimedRewards));
    if (savedHistory) setScanHistory(JSON.parse(savedHistory));
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Save points and medal progress
  useEffect(() => {
    localStorage.setItem('telbin_points', userPoints.toString());

    if (userPoints > 0) {
      const currentMilestone = Math.floor(userPoints / 1000);
      const lastMilestone = Math.floor(lastMedalPoints / 1000);
      
      if (currentMilestone > lastMilestone && currentMilestone > 0) {
        setMedalLevel(currentMilestone);
        setShowMedalSplash(true);
        setLastMedalPoints(userPoints);
        localStorage.setItem('telbin_last_medal', userPoints.toString());
      }
    }
  }, [userPoints, lastMedalPoints]);

  // Save claimed rewards to localStorage
  useEffect(() => {
    localStorage.setItem('telbin_claimed_rewards', JSON.stringify(claimedRewards));
  }, [claimedRewards]);

  // Save scan history to localStorage
  useEffect(() => {
    localStorage.setItem('telbin_scan_history', JSON.stringify(scanHistory));
  }, [scanHistory]);

  const completeOnboarding = () => {
    localStorage.setItem('telbin_onboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    // Clear sensitive local state if needed
    // localStorage.clear();
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Add scan after successful report submission
  const addScan = (submittedScan: any) => {
    const newScan = {
      ...submittedScan,
      id: scanHistory.length + 1,
      timestamp: new Date(),
    };
    setScanHistory([newScan, ...scanHistory]);
    addNotification(`🎉 Earned 10 points for submitting a report!`, 'success');
  };

  const handleClaimReward = (rewardId: number, rewardName: string, bonusPoints: number) => {
    if (!claimedRewards.includes(rewardId)) {
      setClaimedRewards([...claimedRewards, rewardId]);
      setUserPoints(userPoints + bonusPoints);
      addNotification(`🎁 Claimed ${rewardName}! (+${bonusPoints} bonus points)`, 'success');
    }
  };

  if (!hasSeenOnboarding) return <Onboarding onComplete={completeOnboarding} />;
  if (!isLoggedIn) return <LoginRegister onLogin={handleLogin} />;

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
            onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
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
