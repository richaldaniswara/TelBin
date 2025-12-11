import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Submission {
  location: string;
  proofURL: string;
  scannedTrash: string;
  submissionId: string;
  timestampString: string; // FIX: this is the correct field
  trashClass: string;
  userId: string;
}

export default function History() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [userHistory, setUserHistory] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const ALLOWED_CLASSES = [
    "biodegradable",
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic"
  ];

  const classColors: Record<string, string> = {
    plastic: "bg-blue-100 text-blue-600",
    glass: "bg-green-100 text-green-600",
    metal: "bg-gray-100 text-gray-600",
    paper: "bg-amber-100 text-amber-600",
    biodegradable: "bg-lime-100 text-lime-600",
    cardboard: "bg-orange-100 text-orange-600"
  };

  const filters = [
    { id: "all", label: "All" },
    ...ALLOWED_CLASSES.map(cls => ({
      id: cls,
      label: cls.charAt(0).toUpperCase() + cls.slice(1)
    }))
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user || !user.email) return;

      const q = query(collection(db, "User"), where("email", "==", user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as any;
        setUserHistory(data.history || []);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const filteredHistory =
    filter === "all"
      ? userHistory
      : userHistory.filter(sub => sub.trashClass.toLowerCase() === filter);

  const formatDate = (timestampStr: string) => {
    const date = new Date(timestampStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-gray-800">Submission History</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                filter === f.id
                  ? "bg-[#34A853] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-400">No scans found</p>
            <p className="text-gray-400">
              {filter === "all"
                ? "Start scanning items!"
                : `No ${filter} items scanned yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((submission, index) => {
              const currDate = new Date(submission.timestampString);
              const prevDate =
                index > 0
                  ? new Date(
                      filteredHistory[index - 1].timestampString
                    )
                  : null;

              const showDate =
                index === 0 ||
                currDate.toDateString() !== prevDate?.toDateString();

              return (
                <div key={submission.submissionId}>
                  {showDate && (
                    <div className="text-gray-500 mb-3 mt-4">
                      {currDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </div>
                  )}

                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-green-200 transition-colors">
                    <div className="flex gap-4">
                      <img
                        src={submission.scannedTrash || submission.proofURL}
                        alt={submission.trashClass}
                        className="w-20 h-20 rounded-xl object-cover"
                      />

                      <div className="flex-1">
                        <h3 className="text-gray-800 mb-1">
                          <span className="font-semibold">Location:</span>{" "}
                          {submission.location}
                        </h3>

                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              classColors[submission.trashClass] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {submission.trashClass}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-gray-400">
                            {formatDate(submission.timestampString)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
