'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  activePole: string;
  setActivePole: (pole: string) => void;
  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
}

const AppContext = createContext<AppContextType>({
  activePole: 'all',
  setActivePole: () => {},
  toasts: [],
  toast: () => {},
  removeToast: () => {},
});

let toastCounter = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activePole, setActivePole] = useState('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ activePole, setActivePole, toasts, toast, removeToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
