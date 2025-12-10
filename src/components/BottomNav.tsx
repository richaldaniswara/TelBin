import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, Award, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Award, label: 'Rewards', path: '/rewards' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-colors ${
                isActive ? 'text-[#34A853]' : 'text-gray-400'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-[#34A853]' : 'text-gray-400'}`} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
