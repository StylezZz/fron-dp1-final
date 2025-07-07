import React from 'react';

interface Truck {
  id: string;
  location: { x: number; y: number };
  assignedOrders?: string[];
}
interface Order {
  id: string;
  location: { lat: number; lng: number };
}

interface MapConnectionsProps {
  trucks: Truck[];
  orders: Order[];
  isAnimating?: boolean;
}

const MapConnections: React.FC<MapConnectionsProps> = React.memo(({ trucks, orders, isAnimating }) => {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      {trucks.map(truck =>
        truck.assignedOrders?.map(orderId => {
          const order = orders.find(o => o.id === orderId);
          if (!order) return null;
          return (
            <line
              key={`connection-${truck.id}-${orderId}`}
              x1={truck.location.x * 40}
              y1={window.innerHeight - truck.location.y * 40}
              x2={order.location.lng * 40}
              y2={window.innerHeight - order.location.lat * 40}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
              className={isAnimating ? 'animate-pulse' : ''}
            />
          );
        })
      )}
    </svg>
  );
});

export default MapConnections; 