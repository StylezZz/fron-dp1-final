import React from 'react';

interface Point { x: number; y: number; }

interface MapRouteProps {
  id: string;
  start: Point;
  end: Point;
  waypoints: Point[];
  color: string;
  isAnimating?: boolean;
}

const MapRoute: React.FC<MapRouteProps> = React.memo(({ id, start, end, waypoints, color, isAnimating }) => {
  // Construir el path SVG
  const path = `M ${start.x * 40} ${window.innerHeight - start.y * 40} ` +
    waypoints.map(wp => `L ${wp.x * 40} ${window.innerHeight - wp.y * 40}`).join(' ') +
    ` L ${end.x * 40} ${window.innerHeight - end.y * 40}`;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d={path}
        stroke={`url(#gradient-${id})`}
        strokeWidth="3"
        fill="none"
        strokeDasharray="10,5"
        className={isAnimating ? 'animate-pulse' : ''}
      />
      {/* Indicador de dirección */}
      <circle
        cx={end.x * 40}
        cy={window.innerHeight - end.y * 40}
        r="4"
        fill={color}
        className={isAnimating ? 'animate-ping' : ''}
      />
    </svg>
  );
});

export default MapRoute; 