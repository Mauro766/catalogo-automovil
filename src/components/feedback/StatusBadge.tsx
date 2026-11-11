import type { VehicleStatus } from '../../types';

interface StatusBadgeProps {
  status: VehicleStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusMap: Record<VehicleStatus, string> = {
    Disponible: 'badge success',
    Reservado: 'badge warning',
    Vendido: 'badge danger',
    Borrador: 'badge neutral',
  };

  return <span className={statusMap[status]}>{status}</span>;
};
