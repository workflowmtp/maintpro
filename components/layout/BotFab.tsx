'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRef } from 'react';

export function BotFab() {
  const { hasPermission, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const previousPage = useRef('/dashboard');

  if (!isAuthenticated || !hasPermission('bot')) return null;

  const isOnBot = pathname === '/maintbot';

  const handleClick = () => {
    if (isOnBot) {
      router.push(previousPage.current);
    } else {
      previousPage.current = pathname;
      router.push('/maintbot');
    }
  };

  return (
    <button
      className="bot-fab"
      onClick={handleClick}
      title={isOnBot ? 'Fermer MaintBot' : 'MaintBot — Assistant IA'}
      style={{
        background: isOnBot
          ? 'linear-gradient(135deg, #f05555, #b91c1c)'
          : 'linear-gradient(135deg, #4b8df8, #9b6ff6)',
      }}
    >
      {isOnBot ? '✕' : '🤖'}
    </button>
  );
}
