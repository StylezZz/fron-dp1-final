// hooks/useTruckPosition.ts
import { useState, useEffect } from 'react';

interface RouteNode {
  id: number;
  x: number;
  y: number;
  tiempoInicio: number;
  tiempoFin: number;
  esAlmacen?: boolean;
  esPedido?: boolean;
}

interface TruckPosition {
  x: number;
  y: number;
  isMoving: boolean;
  progress: number; // 0-1 entre dos nodos
}

export const useTruckPosition = (route: RouteNode[], currentTime: number, ubicacionActual?: RouteNode) => {
  const [position, setPosition] = useState<TruckPosition>({
    x: 0,
    y: 0,
    isMoving: false,
    progress: 0
  });

  useEffect(() => {
    // Si no hay ruta, usar ubicación actual
    if (!route || route.length === 0) {
      if (ubicacionActual) {
        setPosition({
          x: ubicacionActual.x,
          y: ubicacionActual.y,
          isMoving: false,
          progress: 0
        });
      }
      return;
    }

    // currentTime ya es el Timer ACO (>= 1440)
    // Buscar nodo exacto donde estamos actualmente
    const nodoActual = route.find(node => 
      currentTime >= node.tiempoInicio && currentTime <= node.tiempoFin
    );

    if (nodoActual) {
      // Estamos en un nodo específico
      setPosition({
        x: nodoActual.x,
        y: nodoActual.y,
        isMoving: false,
        progress: 0
      });
      return;
    }

    // Buscar si estamos entre dos nodos consecutivos (en tránsito)
    let encontrado = false;
    for (let i = 0; i < route.length - 1; i++) {
      const current = route[i];
      const next = route[i + 1];
      
      // Verificar si estamos en el tiempo entre el fin del nodo actual y el inicio del siguiente
      if (currentTime > current.tiempoFin && currentTime < next.tiempoInicio) {
        const totalTime = next.tiempoInicio - current.tiempoFin;
        const elapsedTime = currentTime - current.tiempoFin;
        const progress = totalTime > 0 ? Math.min(elapsedTime / totalTime, 1) : 0;
        
        const x = current.x + (next.x - current.x) * progress;
        const y = current.y + (next.y - current.y) * progress;
        
        setPosition({
          x,
          y,
          isMoving: true,
          progress
        });
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      // Si no encontramos posición exacta, usar el nodo más cercano por tiempo
      let minDiff = Infinity;
      let closestNode = route[0];
      
      route.forEach(node => {
        const startDiff = Math.abs(node.tiempoInicio - currentTime);
        const endDiff = Math.abs(node.tiempoFin - currentTime);
        const minNodeDiff = Math.min(startDiff, endDiff);
        
        if (minNodeDiff < minDiff) {
          minDiff = minNodeDiff;
          closestNode = node;
        }
      });
      
      setPosition({
        x: closestNode.x,
        y: closestNode.y,
        isMoving: false,
        progress: 0
      });
    }
  }, [route, currentTime, ubicacionActual]);

  return position;
};

// Hook para calcular estadísticas de ruta
export const useTruckRouteStats = (route: RouteNode[], currentTime: number) => {
  const [stats, setStats] = useState({
    totalNodes: 0,
    completedNodes: 0,
    currentNodeIndex: -1,
    estimatedCompletion: 0,
    totalDistance: 0
  });

  useEffect(() => {
    if (!route || route.length === 0) {
      setStats({
        totalNodes: 0,
        completedNodes: 0,
        currentNodeIndex: -1,
        estimatedCompletion: 0,
        totalDistance: 0
      });
      return;
    }

    // Calcular nodos completados
    let completedNodes = 0;
    let currentNodeIndex = -1;
    
    route.forEach((node, index) => {
      if (currentTime >= node.tiempoFin) {
        completedNodes++;
      } else if (currentTime >= node.tiempoInicio && currentNodeIndex === -1) {
        currentNodeIndex = index;
      }
    });

    // Calcular distancia total
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const dx = route[i + 1].x - route[i].x;
      const dy = route[i + 1].y - route[i].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    // Estimar tiempo de completación
    const lastNode = route[route.length - 1];
    const estimatedCompletion = lastNode ? lastNode.tiempoFin : 0;

    setStats({
      totalNodes: route.length,
      completedNodes,
      currentNodeIndex,
      estimatedCompletion,
      totalDistance: Math.round(totalDistance * 100) / 100
    });
  }, [route, currentTime]);

  return stats;
};

export default useTruckPosition;