import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { DataProvider } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'MaintPro v3+ — Gestion Maintenance Industrielle Multi-Poles',
  description: 'Application de gestion de maintenance industrielle multi-poles pour MULTIPRINT',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DataProvider>
          <AuthProvider>
            <AppProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </AppProvider>
          </AuthProvider>
        </DataProvider>
      </body>
    </html>
  );
}
