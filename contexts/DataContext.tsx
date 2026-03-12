'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { _setCache, _setSingle } from '@/lib/store';

const COLLECTIONS = [
  'users', 'poles', 'ateliers', 'techniciens', 'operateurs', 'chefs_atelier',
  'machines', 'organes', 'causes', 'pieces', 'interventions', 'actions',
  'stock_movements', 'demandes_achat', 'sous_traitances', 'taches_preventives',
  'signalements',
];

interface DataContextType {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  loading: true,
  loaded: false,
  error: null,
  refreshAll: async () => {},
});

const PUBLIC_PAGES = ['/login', '/register'];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const [loading, setLoading] = useState(!isPublicPage);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        COLLECTIONS.map(async (col) => {
          try {
            const res = await fetch('/api/data/' + col);
            if (!res.ok) return [col, []] as [string, any[]];
            const items = await res.json();
            return [col, items] as [string, any[]];
          } catch {
            return [col, []] as [string, any[]];
          }
        })
      );
      results.forEach(([col, items]) => {
        _setCache(col, items);
      });
      // Fetch company_info (single object)
      try {
        const ciRes = await fetch('/api/data/company_info');
        if (ciRes.ok) {
          const ciData = await ciRes.json();
          // API returns array, take first element
          const ci = Array.isArray(ciData) ? ciData[0] : ciData;
          if (ci) _setSingle('company_info', ci);
        }
      } catch {}
      setLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPublicPage) {
      refreshAll();
    } else {
      setLoading(false);
    }
  }, [refreshAll, isPublicPage]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main, #0f1117)', color: 'var(--text-primary, #e2e8f0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙</div>
          <div>Chargement des donnees...</div>
          {error && <div style={{ color: '#f05555', marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ loading, loaded, error, refreshAll }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
