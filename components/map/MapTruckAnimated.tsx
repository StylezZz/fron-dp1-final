// components/map/MapTruckAnimated.tsx
import React, { useState, useEffect } from 'react';
import { Truck, Zap as Lightning, MapPin } from 'lucide-react';

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

interface MapTruckAnimatedProps {
  id: string;
  codigo: string;
  route: RouteNode[];
  currentTime: number;
  ubicacionActual?: RouteNode;
  status?: 'available' | 'in_route' | 'loading' | 'maintenance' | 'broken';
  capacity?: number;
  currentLoad?: number;
  glpDisponible?: number;
  enAveria?: boolean;
  selected?: boolean;
  onClick?: (id: string) => void;
  zoomLevel?: number;
  mapPosition?: { x: number; y: number };
  animationSpeed?: number; // Velocidad de animación (1 = normal, 0.5 = lento, 2 = rápido)
}

const getStatusColor = (codigo: string, enAveria: boolean = false) => {
  if (enAveria) return 'bg-red-600';
  
  if (codigo.startsWith("TA")) return "bg-blue-500";
  if (codigo.startsWith("TB")) return "bg-green-500";
  if (codigo.startsWith("TC")) return "bg-yellow-500";
  if (codigo.startsWith("TD")) return "bg-red-500";
  return "bg-gray-400";
};

const MapTruckAnimated: React.FC<MapTruckAnimatedProps> = ({
  id,
  codigo,
  route,
  currentTime,
  ubicacionActual,
  status = 'in_route',
  capacity = 10,
  currentLoad = 0,
  glpDisponible = 0,
  enAveria = false,
  selected = false,
  onClick,
  zoomLevel = 1,
  mapPosition = { x: 0, y: 0 },
  animationSpeed = 0.3 // Animación más lenta por defecto
}) => {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Función para interpolar posición con suavizado
  const smoothInterpolate = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    factor: number
  ) => {
    // Usar easing cubic para movimiento más natural
    const eased = 1 - Math.pow(1 - factor, 3);
    return {
      x: start.x + (end.x - start.x) * eased,
      y: start.y + (end.y - start.y) * eased
    };
  };

  // Función para interpolar posición entre dos puntos
  const interpolatePosition = (
    start: { x: number; y: number; time: number },
    end: { x: number; y: number; time: number },
    currentTime: number
  ) => {
    if (currentTime <= start.time) return { x: start.x, y: start.y };
    if (currentTime >= end.time) return { x: end.x, y: end.y };
    
    const progress = (currentTime - start.time) / (end.time - start.time);
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    };
  };

  // Calcular posición objetivo basada en la ruta y el tiempo
  useEffect(() => {
    if (!route || route.length === 0) {
      if (ubicacionActual) {
        const newPosition = { x: ubicacionActual.x, y: ubicacionActual.y };
        setTargetPosition(newPosition);
        setCurrentPosition(newPosition);
        setIsMoving(false);
      }
      return;
    }

    // Buscar nodo exacto donde estamos actualmente
    const nodoActual = route.find(node => 
      currentTime >= node.tiempoInicio && currentTime <= node.tiempoFin
    );

    if (nodoActual) {
      // Estamos en un nodo específico
      const newPosition = { x: nodoActual.x, y: nodoActual.y };
      setTargetPosition(newPosition);
      setIsMoving(false);
      return;
    }

    // Buscar si estamos entre dos nodos (en tránsito)
    for (let i = 0; i < route.length - 1; i++) {
      const current = route[i];
      const next = route[i + 1];
      
      if (currentTime > current.tiempoFin && currentTime < next.tiempoInicio) {
        const totalTime = next.tiempoInicio - current.tiempoFin;
        const elapsedTime = currentTime - current.tiempoFin;
        const progress = totalTime > 0 ? Math.min(elapsedTime / totalTime, 1) : 0;
        
        const interpolatedPosition = interpolatePosition(
          { x: current.x, y: current.y, time: current.tiempoFin },
          { x: next.x, y: next.y, time: next.tiempoInicio },
          currentTime
        );
        
        setTargetPosition(interpolatedPosition);
        setIsMoving(true);
        return;
      }
    }

    // Si no encontramos posición exacta, usar el nodo más cercano
    const closestNode = route.reduce((closest, node) => {
      const currentDiff = Math.min(
        Math.abs(node.tiempoInicio - currentTime),
        Math.abs(node.tiempoFin - currentTime)
      );
      const closestDiff = Math.min(
        Math.abs(closest.tiempoInicio - currentTime),
        Math.abs(closest.tiempoFin - currentTime)
      );
      return currentDiff < closestDiff ? node : closest;
    });
    
    const newPosition = { x: closestNode.x, y: closestNode.y };
    setTargetPosition(newPosition);
    setIsMoving(false);
  }, [route, currentTime, ubicacionActual]);

  // Animación suave hacia la posición objetivo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosition(prevPosition => {
        const dx = targetPosition.x - prevPosition.x;
        const dy = targetPosition.y - prevPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Si estamos muy cerca del objetivo, ir directamente
        if (distance < 0.1) {
          return targetPosition;
        }
        
        // Interpolación suave con velocidad configurable
        const factor = Math.min(animationSpeed * 0.1, 1);
        return smoothInterpolate(prevPosition, targetPosition, factor);
      });
    }, 50); // 50ms = 20 FPS para animación suave

    return () => clearInterval(interval);
  }, [targetPosition, animationSpeed, smoothInterpolate]);

  // Calcular posición en el mapa considerando zoom y offset
  const screenPosition = {
    left: currentPosition.x * 40 * zoomLevel + mapPosition.x,
    bottom: currentPosition.y * 40 * zoomLevel + mapPosition.y
  };

  return (
    <div
      className="absolute z-30 group cursor-pointer"
      style={{
        left: `${screenPosition.left}px`,
        bottom: `${screenPosition.bottom}px`,
        transform: 'translate(-50%, 50%)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Transición más suave y lenta
      }}
      onClick={() => onClick && onClick(id)}
    >
      <div className="relative">
        {/* Camión principal */}
        <div 
          className={`w-10 h-10 rounded-full ${getStatusColor(codigo, enAveria)} 
                     border-3 border-white shadow-lg flex items-center justify-center 
                     transition-all duration-300 hover:scale-110 
                     ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''} 
                     ${isMoving ? 'animate-pulse' : ''}`}
        >
          <Truck size={16} className="text-white" />
        </div>

        {/* Indicador de carga */}
        {currentLoad > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        {/* Indicador de avería */}
        {enAveria && (
          <div className="absolute -top-2 -left-2">
            <Lightning size={14} className="text-red-500 animate-pulse" />
          </div>
        )}

        {/* Indicador de movimiento mejorado */}
        {isMoving && (
          <>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            {/* Trail de movimiento */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"></div>
          </>
        )}

        {/* Código del camión */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                       bg-black/70 text-white text-xs px-2 py-1 rounded-md
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {codigo}
        </div>
      </div>

      {/* Tooltip detallado */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 
                     bg-black/90 text-white text-xs px-3 py-2 rounded-lg 
                     opacity-0 group-hover:opacity-100 transition-all duration-300
                     whitespace-nowrap backdrop-blur-sm z-50">
        <div className="font-semibold mb-1">Camión {codigo}</div>
        <div>Posición: ({currentPosition.x.toFixed(1)}, {currentPosition.y.toFixed(1)})</div>
        <div>Objetivo: ({targetPosition.x.toFixed(1)}, {targetPosition.y.toFixed(1)})</div>
        <div>Carga: {currentLoad}/{capacity}kg</div>
        <div>GLP: {glpDisponible}L</div>
        <div>Estado: {enAveria ? 'Averiado' : isMoving ? 'En movimiento' : 'Parado'}</div>
        {status === 'in_route' && (
          <div className="text-green-400">
            Utilización: {((currentLoad / capacity) * 100).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default MapTruckAnimated;