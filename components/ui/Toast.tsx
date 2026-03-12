'use client';

import { useApp } from '@/contexts/AppContext';

export function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} dangerouslySetInnerHTML={{ __html: t.message }} />
      ))}
    </div>
  );
}
