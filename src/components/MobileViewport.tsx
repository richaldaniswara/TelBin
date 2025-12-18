import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface MobileViewportProps {
  children: React.ReactNode;
}

export default function MobileViewport({ children }: MobileViewportProps) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
