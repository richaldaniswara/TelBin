import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Scan {
  id: number;
  image: string;
  category: string;
  confidence: number;
  points: number;
  timestamp: Date;
  type: string;
}

interface HistoryProps {
  scanHistory: Scan[];
}

export default function History({ scanHistory }: HistoryProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'plastic', label: 'Plastic' },
    { id: 'metal', label: 'Metal' },
    { id: 'glass', label: 'Glass' },
    { id: 'paper', label: 'Paper' },
    { id: 'organic', label: 'Organic' }
  ];

  const filteredHistory = filter === 'all'
    ? scanHistory
    : scanHistory.filter(scan => scan.type === filter);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
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
          <h1 className="text-gray-800">Scan History</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-[#34A853] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              {filter === 'all' ? 'Start scanning items!' : `No ${filter} items scanned yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((scan, index) => {
              const showDate = index === 0 || 
                new Date(scan.timestamp).toDateString() !== 
                new Date(filteredHistory[index - 1].timestamp).toDateString();

              return (
                <div key={scan.id}>
                  {showDate && (
                    <div className="text-gray-500 mb-3 mt-4">
                      {new Date(scan.timestamp).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-green-200 transition-colors">
                    <div className="flex gap-4">
                      <img
                        src={scan.image}
                        alt={scan.category}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-gray-800 mb-1">{scan.category}</h3>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            scan.type === 'plastic' ? 'bg-blue-100 text-blue-600' :
                            scan.type === 'glass' ? 'bg-green-100 text-green-600' :
                            scan.type === 'metal' ? 'bg-gray-100 text-gray-600' :
                            scan.type === 'paper' ? 'bg-amber-100 text-amber-600' :
                            'bg-lime-100 text-lime-600'
                          }`}>
                            {scan.type}
                          </span>
                          <span className="text-gray-500">
                            {scan.confidence}% confidence
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-400">{formatDate(scan.timestamp)}</p>
                          <div className="text-[#34A853]">
                            +{scan.points} pts
                          </div>
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
