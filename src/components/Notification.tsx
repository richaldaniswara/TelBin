import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Notification({ message, type = 'success', onClose, duration = 3000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: 'bg-[#34A853] text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div className={`${colors[type]} rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 min-w-[300px] animate-slide-down`}>
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
