import React from 'react';
import { Home } from 'lucide-react';

interface MapWarehouseProps {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  currentStock: number;
  selected?: boolean;
  onClick?: (id: string) => void;
}

const MapWarehouse: React.FC<MapWarehouseProps> = React.memo(({
  id, name, x, y, capacity, currentStock, selected, onClick
}) => {
  return (
    <div
      className="absolute z-30 group cursor-pointer"
      style={{
        left: `${x * 40}px`,
        bottom: `${y * 40}px`,
        transform: 'translate(-50%, 50%)',
      }}
      onClick={() => onClick && onClick(id)}
    >
      <div className="relative">
        <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center border-3 border-white shadow-xl transition-transform hover:scale-110 ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}>
          <Home size={20} className="text-white" />
        </div>
        {/* Indicador de capacidad */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: currentStock / capacity > 0.8 ? '#ef4444' : 
                              currentStock / capacity > 0.5 ? '#f59e0b' : '#10b981'
            }}
          ></div>
        </div>
      </div>
      {/* Tooltip */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
        <div className="font-semibold">{name}</div>
        <div>Stock: {currentStock}/{capacity}</div>
        <div className="text-xs text-gray-300">
          Capacidad: {((currentStock / capacity) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
});

export default MapWarehouse; 