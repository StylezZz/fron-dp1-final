import React from 'react';

interface MapGridProps {
  theme: {
    background: string;
    gridColor: string;
    mainGridColor: string;
    textColor: string;
  };
  zoomLevel: number;
  mapPosition: { x: number; y: number };
  children?: React.ReactNode;
}

const MapGrid: React.FC<MapGridProps> = React.memo(({ theme, zoomLevel, mapPosition, children }) => {
  return (
    <div
      className={`absolute inset-0 ${theme.background}`}
      style={{
        backgroundSize: `${40 * zoomLevel}px ${40 * zoomLevel}px`,
        backgroundImage: `
          linear-gradient(to right, ${theme.gridColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${theme.gridColor} 1px, transparent 1px)
        `,
        backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`,
      }}
    >
      {/* Líneas principales cada 5 unidades */}
      <div
        className="absolute inset-0"
        style={{
          backgroundSize: `${40 * 5 * zoomLevel}px ${40 * 5 * zoomLevel}px`,
          backgroundImage: `
            linear-gradient(to right, ${theme.mainGridColor} 2px, transparent 2px),
            linear-gradient(to bottom, ${theme.mainGridColor} 2px, transparent 2px)
          `,
          backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`,
        }}
      />
      {children}
    </div>
  );
});

export default MapGrid; 