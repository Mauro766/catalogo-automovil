import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger';
  icon: ReactNode;
}

export const StatCard = ({ label, value, accent = 'primary', icon }: StatCardProps) => {
  return (
    <div className="stat-card card">
      <div className={`stat-icon stat-icon-${accent}`}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
};
