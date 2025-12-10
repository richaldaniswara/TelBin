import React from 'react';
import { ArrowLeft, Gift, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RewardsProps {
  userPoints: number;
  scanHistory?: any[];
  claimedRewards?: number[];
  onClaimReward: (rewardId: number, rewardName: string, bonusPoints: number) => void;
}

export default function Rewards({ userPoints, scanHistory = [], claimedRewards = [], onClaimReward }: RewardsProps) {
  const navigate = useNavigate();

  const rewards = [
    {
      id: 1,
      title: 'Eco Sticker Pack',
      description: 'Set of 10 environmental stickers',
      scansRequired: 5,
      bonusPoints: 50,
      icon: '🏷️',
      color: 'bg-blue-100 border-blue-200'
    },
    {
      id: 2,
      title: 'Reusable Tote Bag',
      description: 'Eco-friendly shopping bag',
      scansRequired: 15,
      bonusPoints: 150,
      icon: '👜',
      color: 'bg-green-100 border-green-200'
    },
    {
      id: 3,
      title: 'Tree Planted In Your Name',
      description: 'We plant a tree on your behalf',
      scansRequired: 25,
      bonusPoints: 250,
      icon: '🌳',
      color: 'bg-lime-100 border-lime-200'
    },
    {
      id: 4,
      title: 'Bamboo Cutlery Set',
      description: 'Reusable utensils for on-the-go',
      scansRequired: 20,
      bonusPoints: 200,
      icon: '🍴',
      color: 'bg-amber-100 border-amber-200'
    },
    {
      id: 5,
      title: 'Water Bottle',
      description: 'Stainless steel insulated bottle',
      scansRequired: 30,
      bonusPoints: 300,
      icon: '💧',
      color: 'bg-cyan-100 border-cyan-200'
    },
    {
      id: 6,
      title: 'Premium TelBin Badge',
      description: 'Exclusive digital badge',
      scansRequired: 50,
      bonusPoints: 500,
      icon: '🏆',
      color: 'bg-yellow-100 border-yellow-200'
    },
    {
      id: 7,
      title: 'Recycled Notebook',
      description: '100% recycled paper notebook',
      scansRequired: 10,
      bonusPoints: 100,
      icon: '📓',
      color: 'bg-purple-100 border-purple-200'
    },
    {
      id: 8,
      title: 'Bee-Friendly Seed Kit',
      description: 'Help save the bees!',
      scansRequired: 18,
      bonusPoints: 175,
      icon: '🐝',
      color: 'bg-orange-100 border-orange-200'
    }
  ];

  const calculateProgress = (requiredScans: number) => {
    return Math.min((scanHistory.length / requiredScans) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-gray-800">Rewards</h1>
        </div>

        <div className="bg-gradient-to-r from-[#34A853] to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-90 mb-1">Your Points</p>
              <div className="flex items-center gap-2">
                <Award className="w-8 h-8" />
                <span className="text-white">{userPoints}</span>
              </div>
            </div>
            <div className="text-5xl">🎁</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid gap-4">
          {rewards.map((reward) => {
            const progress = calculateProgress(reward.scansRequired);
            const canClaim = scanHistory.length >= reward.scansRequired;
            const isClaimed = claimedRewards.includes(reward.id);
            const nextGoal = reward.scansRequired + 5;

            return (
              <div
                key={reward.id}
                className={`border-2 rounded-3xl p-5 transition-all ${
                  isClaimed
                    ? 'bg-gray-50 border-gray-200 opacity-75'
                    : canClaim
                    ? 'bg-green-50 border-[#34A853] shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${reward.color} border-2 ${isClaimed ? 'opacity-50' : ''}`}>
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-800 mb-1">{reward.title}</h3>
                    <p className="text-gray-500 mb-2">{reward.description}</p>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#34A853]" />
                      <span className={`${isClaimed ? 'text-gray-400 line-through' : 'text-[#34A853]'}`}>
                        +{reward.bonusPoints} bonus pts
                      </span>
                    </div>
                    {isClaimed && (
                      <p className="text-xs text-green-600 mt-2">✓ Claimed</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Progress</span>
                    <span>
                      {isClaimed ? `${nextGoal} / ${nextGoal} scans` : `${scanHistory.length} / ${reward.scansRequired} scans`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${isClaimed ? 'bg-gray-300' : 'bg-[#34A853]'}`}
                      style={{ width: `${isClaimed ? 100 : progress}%` }}
                    />
                  </div>
                </div>

                {!isClaimed && canClaim && (
                  <button 
                    onClick={() => onClaimReward(reward.id, reward.title, reward.bonusPoints)}
                    className="w-full mt-4 bg-[#34A853] text-white rounded-full py-3 hover:bg-green-600 transition-colors"
                  >
                    Claim Reward
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
