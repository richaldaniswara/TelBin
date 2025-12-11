import React, { useEffect, useState } from 'react';
import { Award, Sparkles, X } from 'lucide-react';

interface MedalSplashProps {
  medalLevel: number;
  onClose: () => void;
}

export default function MedalSplash({ medalLevel, onClose }: MedalSplashProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const medals = {
    1: { emoji: '🥉', color: 'from-amber-600 to-amber-400', title: 'Bronze Eco Champion', bg: 'bg-amber-50' },
    2: { emoji: '🥈', color: 'from-gray-400 to-gray-300', title: 'Silver Eco Champion', bg: 'bg-gray-50' },
    3: { emoji: '🥇', color: 'from-yellow-500 to-yellow-300', title: 'Gold Eco Champion', bg: 'bg-yellow-50' },
    4: { emoji: '💎', color: 'from-cyan-500 to-blue-400', title: 'Platinum Eco Champion', bg: 'bg-cyan-50' },
    5: { emoji: '🏆', color: 'from-purple-500 to-pink-400', title: 'Diamond Eco Champion', bg: 'bg-purple-50' }
  };

  const medal = medals[medalLevel as keyof typeof medals] || medals[Math.min(medalLevel, 5) as keyof typeof medals] || medals[5];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      }`}>
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${medal.color} opacity-10`} />
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 text-center">
          {/* Animated Medal */}
          <div className="mb-6 animate-bounce-slow">
            <div className="text-8xl mb-2">{medal.emoji}</div>
            <div className="flex justify-center gap-2">
              <Sparkles className="w-6 h-6 text-[#34A853] animate-pulse" />
              <Sparkles className="w-6 h-6 text-[#34A853] animate-pulse delay-75" />
              <Sparkles className="w-6 h-6 text-[#34A853] animate-pulse delay-150" />
            </div>
          </div>

          <h2 className="text-3xl mb-2">Congratulations!</h2>
          <h3 className="text-xl text-[#34A853] mb-4">{medal.title}</h3>
          
          <div className="w-16 h-1 bg-[#34A853] rounded-full mx-auto mb-6" />

          <p className="text-lg mb-2">You've reached {medalLevel * 1000} points!</p>
          <p className="text-gray-600 mb-6">Keep up the amazing work protecting our planet!</p>

          <div className="flex justify-center gap-4 mb-8">
            <div className="text-4xl animate-bounce delay-0">🌍</div>
            <div className="text-4xl animate-bounce delay-100">♻️</div>
            <div className="text-4xl animate-bounce delay-200">🌱</div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-100">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Award className="w-8 h-8 text-[#34A853]" />
              <div className="text-4xl text-[#34A853]">{medalLevel * 1000}</div>
            </div>
            <p className="text-gray-600">Points Milestone Achieved</p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-[#34A853] text-white rounded-full py-4 hover:bg-green-600 transition-colors shadow-lg"
          >
            Continue Journey
          </button>
        </div>
      </div>
    </div>
  );
}
