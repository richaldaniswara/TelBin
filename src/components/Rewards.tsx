import React, { useEffect, useState } from 'react';
import { ArrowLeft, Gift, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  increment
} from "firebase/firestore";

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function Rewards() {
  const navigate = useNavigate();

  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userPoints, setUserPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [userDocRef, setUserDocRef] = useState<any>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Function to add notification
  const addNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000); // disappear after 4 seconds
  };

  // Fetch rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const q = await getDocs(collection(db, 'Reward'));
        const rewardList = q.docs.map((doc) => ({
          rewardId: doc.data().rewardId,
          ...doc.data()
        }));

        rewardList.sort((a, b) => a.submissionsRequired - b.submissionsRequired);
        setRewards(rewardList);
      } catch (error) {
        console.error("Error fetching rewards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !user.email) return;

        const q = query(collection(db, "User"), where("email", "==", user.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          const data = snapshot.docs[0].data();

          setUserDocRef(docRef);
          setUserPoints(data.totalPoints ?? 0);
          setClaimedRewards(data.claimedRewards ?? []);
          setHistory(data.history ?? []);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Handle claim reward
  const handleClaimReward = async (rewardId: string, rewardName: string, bonus: number) => {
    if (!userDocRef) return;

    try {
      await updateDoc(userDocRef, {
        totalPoints: increment(bonus),
        claimedRewards: arrayUnion(rewardId)
      });

      // Update UI instantly
      setUserPoints((prev) => prev + bonus);
      setClaimedRewards((prev) => [...prev, rewardId]);

      // Use notification instead of alert
      addNotification(`Successfully claimed ${rewardName}! 🎉`, "success");

    } catch (err) {
      console.error("Error claiming reward:", err);
      addNotification("Failed to claim reward.", "error");
    }
  };

  const calculateProgress = (required: number) => {
    return Math.min((history.length / required) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading rewards...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">

      {/* Notifications */}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded shadow-lg text-white ${
              n.type === "success" ? "bg-green-500" :
              n.type === "error" ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Header */}
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

      {/* Reward List */}
      <div className="px-6 py-6">
        <div className="grid gap-4">
          {rewards.map((reward) => {
            const progress = calculateProgress(reward.submissionsRequired);
            const canClaim = history.length >= reward.submissionsRequired;
            const isClaimed = claimedRewards.includes(reward.rewardId);

            return (
              <div
                key={reward.rewardId}
                className={`border-2 rounded-3xl p-5 transition-all ${
                  isClaimed
                    ? 'bg-gray-50 border-gray-200 opacity-75'
                    : canClaim
                    ? 'bg-green-50 border-[#34A853] shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${reward.color} border-2 ${
                      isClaimed ? 'opacity-50' : ''
                    }`}
                  >
                    {reward.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-gray-800 mb-1">{reward.title}</h3>
                    <p className="text-gray-500 mb-2">{reward.description}</p>

                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#34A853]" />
                      <span
                        className={`${
                          isClaimed ? 'text-gray-400 line-through' : 'text-[#34A853]'
                        }`}
                      >
                        +{reward.bonus} bonus pts
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
                      {isClaimed
                        ? `${reward.submissionsRequired} / ${reward.submissionsRequired} submissions`
                        : `${history.length} / ${reward.submissionsRequired} submissions`}
                    </span>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isClaimed ? 'bg-gray-300' : 'bg-[#34A853]'
                      }`}
                      style={{ width: `${isClaimed ? 100 : progress}%` }}
                    />
                  </div>
                </div>

                {!isClaimed && canClaim && (
                  <button
                    onClick={() =>
                      handleClaimReward(
                        reward.rewardId,
                        reward.title,
                        reward.bonus
                      )
                    }
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
