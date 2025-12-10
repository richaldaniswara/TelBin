import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface MobileViewportProps {
  children: React.ReactNode;
}

export default function MobileViewport({ children }: MobileViewportProps) {
  const [isMobileView, setIsMobileView] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      {/* Toggle Button */}
      <button
        onClick={() => setIsMobileView(!isMobileView)}
        className="fixed top-4 right-4 z-50 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 px-3 py-2"
      >
        {isMobileView ? (
          <>
            <Monitor className="w-4 h-4" />
            <span className="text-xs font-medium">Desktop</span>
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-medium">Mobile</span>
          </>
        )}
      </button>

      {/* Mobile View */}
      {isMobileView ? (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
          {/* Notch */}
          <div className="bg-gray-800 h-6 flex justify-center items-center">
            <div className="w-32 h-5 bg-gray-800 rounded-b-2xl"></div>
          </div>
          
          {/* Screen */}
          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
            {children}
          </div>

          {/* Bottom indicator */}
          <div className="bg-gray-800 h-6 flex justify-center items-center">
            <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      ) : (
        /* Desktop View */
        <div className="w-full">{children}</div>
      )}
    </div>
  );
}
