'use client';

import { getStatusBadgeClass, getCriticiteBadgeClass } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant = 'badge-blue', className = '' }: BadgeProps) {
  return <span className={`badge ${variant} ${className}`}>{children}</span>;
}

export function StatusBadge({ statut }: { statut: string }) {
  if (!statut) return <span>-</span>;
  return <Badge variant={getStatusBadgeClass(statut)}>{statut}</Badge>;
}

export function CriticiteBadge({ criticite }: { criticite: string }) {
  if (!criticite) return <span>-</span>;
  return <Badge variant={getCriticiteBadgeClass(criticite)}>{criticite}</Badge>;
}
