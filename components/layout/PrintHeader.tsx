'use client';

import { useEffect, useState } from 'react';
import Store from '@/lib/store';
import { COMPANY_DEFAULT } from '@/lib/config';
import type { CompanyInfo } from '@/lib/types';

export function PrintHeader() {
  const [company, setCompany] = useState<CompanyInfo>(COMPANY_DEFAULT);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const c = Store.get<CompanyInfo>('company_info') || COMPANY_DEFAULT;
    setCompany(c);

    const updateDate = () => {
      const now = new Date();
      const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const mois = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
      setDateStr('Imprime le ' + jours[now.getDay()] + ' ' + now.getDate() + ' ' + mois[now.getMonth()] + ' ' + now.getFullYear() + ' a ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2));
    };

    updateDate();
    window.addEventListener('beforeprint', updateDate);
    return () => window.removeEventListener('beforeprint', updateDate);
  }, []);

  return (
    <>
      <div className="print-header">
        <div className="print-header-left">
          <div className="print-header-company">{company.nom}</div>
          <div className="print-header-address">{company.adresse}</div>
          <div className="print-header-contact">
            <span>{company.tel}</span> | <span>{company.email}</span>
          </div>
        </div>
        <div className="print-header-right">
          <div className="print-header-app">MaintPro v3+</div>
          <div className="print-header-date">{dateStr}</div>
        </div>
      </div>
      <div className="print-separator" />
    </>
  );
}
