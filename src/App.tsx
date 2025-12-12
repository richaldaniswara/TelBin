import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Onboarding from "./components/Onboarding";
import LoginRegister from "./components/LoginRegister";
import Dashboard from "./components/Dashboard";
import CameraScan from "./components/CameraScan";
import History from "./components/History";
import Rewards from "./components/Rewards";
import Profile from "./components/Profile";

import BottomNav from "./components/BottomNav";
import NotificationContainer, { NotificationItem } from "./components/NotificationContainer";
import MedalSplash from "./components/MedalSplash";
import MobileViewport from "./components/MobileViewport";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  // Global states
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showMedalSplash, setShowMedalSplash] = useState(false);
  const [medalLevel, setMedalLevel] = useState(1);

  // --------------------------
  // ONBOARDING
  // --------------------------
  const completeOnboarding = () => setHasSeenOnboarding(true);

  // --------------------------
  // AUTH STATE LISTENER
  // --------------------------
  // Only used to fetch user info or handle logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Do not auto-login users
      // You can still read user info here if needed
      console.log("Firebase auth state changed, user:", user?.email);
    });
    return () => unsubscribe();
  }, []);

  // --------------------------
  // LOGOUT
  // --------------------------
  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
  };

  // --------------------------
  // NOTIFICATIONS
  // --------------------------
  const addNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // --------------------------
  // MEDAL SPLASH
  // --------------------------
  const triggerMedalSplash = (level: number) => {
    setMedalLevel(level);
    setShowMedalSplash(true);
  };

  // --------------------------
  // FIRST SCREENS
  // --------------------------
  if (!hasSeenOnboarding) return <Onboarding onComplete={completeOnboarding} />;
  if (!isLoggedIn) return <LoginRegister onLogin={() => setIsLoggedIn(true)} />;

  // --------------------------
  // MAIN APP
  // --------------------------
  return (
    <MobileViewport>
      <Router>
        <div className="min-h-screen bg-white pb-20">
          <Routes>
            <Route path="/" element={<Dashboard addNotification={addNotification} />} />
            <Route
              path="/scan"
              element={
                <CameraScan
                  addNotification={addNotification}
                  triggerMedalSplash={triggerMedalSplash}
                />
              }
            />
            <Route path="/history" element={<History />} />
            <Route path="/rewards" element={<Rewards addNotification={addNotification} />} />
            <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <BottomNav />

          <NotificationContainer
            notifications={notifications}
            onRemove={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
          />

          {showMedalSplash && (
            <MedalSplash medalLevel={medalLevel} onClose={() => setShowMedalSplash(false)} />
          )}
        </div>
      </Router>
    </MobileViewport>
  );
}
