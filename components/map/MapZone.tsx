import React from 'react';

interface MapZoneProps {
  id: string;
  name: string;
  center: { x: number; y: number };
  averagePriority: number;
  orderCount: number;
}

const getZoneColor = (avg: number) => {
  if (avg > 3) return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  if (avg > 2.5) return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  if (avg > 2) return { border: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' };
  return { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
};

const MapZone: React.FC<MapZoneProps> = React.memo(({ id, name, center, averagePriority, orderCount }) => {
  const color = getZoneColor(averagePriority);
  return (
    <div
      className="absolute rounded-full border-2 border-dashed opacity-50 pointer-events-none"
      style={{
        left: `${center.x * 40}px`,
        bottom: `${center.y * 40}px`,
        width: `${120}px`,
        height: `${120}px`,
        borderColor: color.border,
        backgroundColor: color.bg,
        transform: 'translate(-50%, 50%)',
      }}
    >
      <div className="absolute top-2 left-2 text-xs font-medium px-2 py-1 bg-white rounded-full">
        {name} ({orderCount})
      </div>
    </div>
  );
});

export default MapZone; 