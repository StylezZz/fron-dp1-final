import React from 'react';
import { Clock, AlertTriangle, Truck, CheckCircle } from 'lucide-react';

interface MapOrderProps {
  id: string;
  lat: number;
  lng: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  customer: string;
  volume: number;
  zone?: string;
  estimatedTime?: number;
  selected?: boolean;
  isAnimating?: boolean;
  onClick?: (id: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const MapOrder: React.FC<MapOrderProps> = React.memo(({
  id, lat, lng, priority, status, customer, volume, zone, estimatedTime, selected, isAnimating, onClick
}) => {
  return (
    <div
      className="absolute z-20 group cursor-pointer"
      style={{
        left: `${lng * 40}px`,
        bottom: `${lat * 40}px`,
        transform: 'translate(-50%, 50%)',
      }}
      onClick={() => onClick && onClick(id)}
    >
      <div className="relative">
        <div className={`w-5 h-5 rounded-full ${getPriorityColor(priority)} border-2 border-white shadow-lg transition-all hover:scale-125 ${selected ? 'ring-3 ring-blue-400 ring-opacity-50 scale-125' : ''} ${isAnimating && priority === 'urgent' ? 'animate-pulse' : ''}`}></div>
        {/* Indicador de estado */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white">
          {status === 'pending' && <Clock size={8} className="text-gray-600 m-0.5" />}
          {status === 'assigned' && <AlertTriangle size={8} className="text-blue-600 m-0.5" />}
          {status === 'in_transit' && <Truck size={8} className="text-purple-600 m-0.5" />}
          {status === 'delivered' && <CheckCircle size={8} className="text-green-600 m-0.5" />}
        </div>
      </div>
      {/* Tooltip */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
        <div className="font-semibold">{customer}</div>
        <div>Volumen: {volume}L</div>
        <div>Estado: {status}</div>
        <div>Prioridad: {priority}</div>
        <div>Zona: {zone}</div>
        <div>ETA: {estimatedTime}min</div>
        <div className="text-xs text-gray-300">ID: {id}</div>
      </div>
    </div>
  );
});

export default MapOrder;
