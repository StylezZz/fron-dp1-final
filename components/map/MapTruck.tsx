import React from 'react';
import { Truck, Zap as Lightning } from 'lucide-react';

interface MapTruckProps {
  id: string;
  x: number;
  y: number;
  status: 'available' | 'in_route' | 'loading' | 'maintenance' | 'broken';
  capacity: number;
  currentLoad: number;
  breakdownRisk?: number;
  selected?: boolean;
  isAnimating?: boolean;
  onClick?: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-500';
    case 'in_route': return 'bg-purple-500';
    case 'loading': return 'bg-yellow-500';
    case 'maintenance': return 'bg-orange-500';
    case 'broken': return 'bg-red-600';
    default: return 'bg-gray-500';
  }
};

const MapTruck: React.FC<MapTruckProps> = React.memo(({
  id, x, y, status, capacity, currentLoad, breakdownRisk, selected, isAnimating, onClick
}) => {
  return (
    <div
      className="absolute z-25 group cursor-pointer"
      style={{
        left: `${x * 40}px`,
        bottom: `${y * 40}px`,
        transform: 'translate(-50%, 50%)',
      }}
      onClick={() => onClick && onClick(id)}
    >
      <div className="relative">
        <div className={`w-8 h-8 rounded-full ${getStatusColor(status)} border-3 border-white shadow-lg flex items-center justify-center transition-all hover:scale-110 ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''} ${isAnimating && status === 'in_route' ? 'animate-bounce' : ''}`}>
          <Truck size={14} className="text-white" />
        </div>
        {/* Indicador de carga */}
        {currentLoad > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        )}
        {/* Indicador de avería */}
        {status === 'broken' && (
          <div className="absolute -top-2 -left-2">
            <Lightning size={12} className="text-red-500 animate-pulse" />
          </div>
        )}
      </div>
      {/* Tooltip */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
        <div className="font-semibold">Camión {id}</div>
        <div>Carga: {currentLoad}/{capacity}kg</div>
        <div>Estado: {status}</div>
        <div>Riesgo: {breakdownRisk}%</div>
        <div className="text-xs text-gray-300">
          Utilización: {((currentLoad / capacity) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
});

export default MapTruck; 