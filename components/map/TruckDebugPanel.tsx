// components/map/TruckDebugPanel.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Truck, MapPin, Clock, Navigation, AlertTriangle } from 'lucide-react';

interface RouteNode {
  id: number;
  x: number;
  y: number;
  tiempoInicio: number;
  tiempoFin: number;
  esAlmacen?: boolean;
  esPedido?: boolean;
  pedido?: any;
}

interface TruckData {
  id: number;
  codigo: string;
  route: RouteNode[];
  ubicacionActual?: RouteNode;
  cargaAsignada?: number;
  carga?: number;
  glpDisponible?: number;
  enAveria?: boolean;
}

interface TruckDebugPanelProps {
  trucks: TruckData[];
  currentTime: number;
  timerACO: number;
  isVisible: boolean;
  onToggle: () => void;
}

const TruckDebugPanel: React.FC<TruckDebugPanelProps> = ({
  trucks,
  currentTime,
  timerACO,
  isVisible,
  onToggle
}) => {
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);

  const formatTime = (minutes: number) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.floor(minutes % 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const getCurrentNodeForTruck = (truck: TruckData) => {
    if (!truck.route || truck.route.length === 0) return null;
    
    // Buscar nodo actual
    const currentNode = truck.route.find(node => 
      timerACO >= node.tiempoInicio && timerACO <= node.tiempoFin
    );
    
    if (currentNode) return currentNode;
    
    // Si no está en ningún nodo, buscar el más cercano
    return truck.route.reduce((closest, node) => {
      const currentDiff = Math.abs(node.tiempoInicio - timerACO);
      const closestDiff = Math.abs(closest.tiempoInicio - timerACO);
      return currentDiff < closestDiff ? node : closest;
    });
  };

  const getTruckStatus = (truck: TruckData) => {
    if (truck.enAveria) return { status: 'Averiado', color: 'text-red-600' };
    
    const currentNode = getCurrentNodeForTruck(truck);
    if (!currentNode) return { status: 'Sin ruta', color: 'text-gray-500' };
    
    if (currentNode.esAlmacen) return { status: 'En almacén', color: 'text-blue-600' };
    if (currentNode.esPedido) return { status: 'Entregando', color: 'text-green-600' };
    
    return { status: 'En tránsito', color: 'text-yellow-600' };
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Mostrar panel de debug"
      >
        <Truck size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-blue-600" />
          <span className="font-semibold">Monitor de Camiones</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Info general */}
      <div className="p-3 bg-gray-50 border-b border-gray-200 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-600">Tiempo actual:</span>
            <div className="font-mono">{formatTime(currentTime)}</div>
          </div>
          <div>
            <span className="text-gray-600">Timer ACO:</span>
            <div className="font-mono">{timerACO.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Lista de camiones */}
      <div className="overflow-y-auto max-h-64">
        {trucks.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay camiones cargados
          </div>
        ) : (
          trucks.map((truck) => {
            const currentNode = getCurrentNodeForTruck(truck);
            const status = getTruckStatus(truck);
            const isSelected = selectedTruck === truck.codigo;

            return (
              <div key={truck.codigo} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => setSelectedTruck(isSelected ? null : truck.codigo)}
                  className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        truck.enAveria ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <span className="font-medium">{truck.codigo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${status.color}`}>
                        {status.status}
                      </span>
                      {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                  
                  {currentNode && (
                    <div className="mt-1 text-xs text-gray-600">
                      Pos: ({currentNode.x}, {currentNode.y}) • 
                      Carga: {truck.cargaAsignada || 0}/{truck.carga || 10}
                    </div>
                  )}
                </button>

                {/* Detalles expandidos */}
                {isSelected && (
                  <div className="px-3 pb-3 bg-gray-50 text-xs space-y-2">
                    {currentNode ? (
                      <>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>Posición: ({currentNode.x}, {currentNode.y})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>
                            Nodo: {formatTime(currentNode.tiempoInicio)} - {formatTime(currentNode.tiempoFin)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation size={12} />
                          <span>Ruta: {truck.route?.length || 0} nodos</span>
                        </div>
                        {truck.enAveria && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle size={12} />
                            <span>CAMIÓN AVERIADO</span>
                          </div>
                        )}
                        {currentNode.esPedido && currentNode.pedido && (
                          <div className="bg-yellow-100 p-2 rounded">
                            <div className="font-medium">Entregando pedido:</div>
                            <div>Cliente: {currentNode.pedido.idCliente}</div>
                            <div>GLP: {currentNode.pedido.cantidadGLP}L</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500">Sin información de posición</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TruckDebugPanel;