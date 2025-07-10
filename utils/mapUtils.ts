// utils/mapUtils.ts
// Utilidades centralizadas para manejo del mapa y validación de posiciones

// CONSTANTES DEL MAPA - Fuente única de verdad
export const MAP_BOUNDS = {
    MIN_X: 0,
    MAX_X: 70,
    MIN_Y: 0,
    MAX_Y: 50,
    CELL_SIZE: 40, // Tamaño de cada celda en píxeles
    MAIN_GRID_INTERVAL: 5 // Intervalo para líneas principales del grid
  } as const;
  
  // Tipos para posiciones
  export interface Position {
    x: number;
    y: number;
  }
  
  export interface PositionWithTime extends Position {
    time: number;
  }
  
  export interface RouteNode extends Position {
    id: number;
    tiempoInicio: number;
    tiempoFin: number;
    esAlmacen?: boolean;
    esPedido?: boolean;
    pedido?: any;
  }
  
  // Función para validar si una posición está dentro de los límites del mapa
  export const isValidPosition = (x: number, y: number): boolean => {
    return x >= MAP_BOUNDS.MIN_X && x <= MAP_BOUNDS.MAX_X && 
           y >= MAP_BOUNDS.MIN_Y && y <= MAP_BOUNDS.MAX_Y;
  };
  
  // Función para validar una posición usando un objeto Position
  export const isValidPositionObj = (position: Position): boolean => {
    return isValidPosition(position.x, position.y);
  };
  
  // Función para forzar una posición dentro de los límites del mapa (clamp)
  export const clampToMapBounds = (x: number, y: number): Position => {
    return {
      x: Math.max(MAP_BOUNDS.MIN_X, Math.min(MAP_BOUNDS.MAX_X, x)),
      y: Math.max(MAP_BOUNDS.MIN_Y, Math.min(MAP_BOUNDS.MAX_Y, y))
    };
  };
  
  // Función para forzar una posición usando un objeto Position
  export const clampPositionToMapBounds = (position: Position): Position => {
    return clampToMapBounds(position.x, position.y);
  };
  
  // Función para validar y corregir una ruta completa
  export const validateAndClampRoute = (route: RouteNode[]): RouteNode[] => {
    return route.map(node => {
      const clampedPosition = clampToMapBounds(node.x, node.y);
      
      // Log warning si la posición fue corregida
      if (!isValidPosition(node.x, node.y)) {
        console.warn(`🗺️ Nodo de ruta corregido: (${node.x}, ${node.y}) → (${clampedPosition.x}, ${clampedPosition.y})`);
      }
      
      return {
        ...node,
        x: clampedPosition.x,
        y: clampedPosition.y
      };
    });
  };
  
  // Función para interpolar entre dos posiciones validando límites
  export const interpolatePosition = (
    start: PositionWithTime,
    end: PositionWithTime,
    currentTime: number
  ): Position => {
    if (currentTime <= start.time) {
      return clampToMapBounds(start.x, start.y);
    }
    if (currentTime >= end.time) {
      return clampToMapBounds(end.x, end.y);
    }
    
    const progress = (currentTime - start.time) / (end.time - start.time);
    const interpolated = {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    };
    
    return clampToMapBounds(interpolated.x, interpolated.y);
  };
  
  // Función para interpolar con suavizado (easing)
  export const smoothInterpolate = (
    start: Position,
    end: Position,
    factor: number,
    easingType: 'linear' | 'easeInOut' | 'easeOut' = 'easeOut'
  ): Position => {
    let easedFactor = factor;
    
    switch (easingType) {
      case 'easeInOut':
        easedFactor = factor < 0.5 
          ? 2 * factor * factor 
          : 1 - Math.pow(-2 * factor + 2, 3) / 2;
        break;
      case 'easeOut':
        easedFactor = 1 - Math.pow(1 - factor, 3);
        break;
      case 'linear':
      default:
        easedFactor = factor;
    }
    
    const interpolated = {
      x: start.x + (end.x - start.x) * easedFactor,
      y: start.y + (end.y - start.y) * easedFactor
    };
    
    return clampToMapBounds(interpolated.x, interpolated.y);
  };
  
  // Función para calcular distancia entre dos posiciones
  export const calculateDistance = (pos1: Position, pos2: Position): number => {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Función para convertir coordenadas del mapa a píxeles de pantalla
  export const mapToScreenPosition = (
    position: Position,
    zoomLevel: number,
    mapOffset: Position
  ): Position => {
    const clampedPos = clampToMapBounds(position.x, position.y);
    return {
      x: clampedPos.x * MAP_BOUNDS.CELL_SIZE * zoomLevel + mapOffset.x,
      y: clampedPos.y * MAP_BOUNDS.CELL_SIZE * zoomLevel + mapOffset.y
    };
  };
  
  // Función para convertir coordenadas de pantalla a coordenadas del mapa
  export const screenToMapPosition = (
    screenPosition: Position,
    zoomLevel: number,
    mapOffset: Position
  ): Position => {
    const mapPos = {
      x: (screenPosition.x - mapOffset.x) / (MAP_BOUNDS.CELL_SIZE * zoomLevel),
      y: (screenPosition.y - mapOffset.y) / (MAP_BOUNDS.CELL_SIZE * zoomLevel)
    };
    
    return clampToMapBounds(mapPos.x, mapPos.y);
  };
  
  // Función para obtener el nodo más cercano en una ruta basado en el tiempo
  export const getClosestRouteNode = (route: RouteNode[], currentTime: number): RouteNode | null => {
    if (!route || route.length === 0) return null;
    
    const validatedRoute = validateAndClampRoute(route);
    
    let closestNode = validatedRoute[0];
    let smallestTimeDiff = Math.abs(currentTime - validatedRoute[0].tiempoInicio);
  
    for (const node of validatedRoute) {
      const timeDiff = Math.abs(currentTime - node.tiempoInicio);
      if (timeDiff < smallestTimeDiff) {
        smallestTimeDiff = timeDiff;
        closestNode = node;
      }
    }
  
    return closestNode;
  };
  
  // Función para obtener la posición interpolada en una ruta
  export const getRoutePositionAtTime = (route: RouteNode[], currentTime: number): Position => {
    const validatedRoute = validateAndClampRoute(route);
    
    if (validatedRoute.length === 0) {
      console.warn('🗺️ Ruta vacía, usando posición por defecto');
      return { x: MAP_BOUNDS.MIN_X, y: MAP_BOUNDS.MIN_Y };
    }
  
    // Encontrar nodos para interpolación
    let currentNode = validatedRoute[0];
    let nextNode: RouteNode | null = null;
  
    for (let i = 0; i < validatedRoute.length - 1; i++) {
      if (currentTime >= validatedRoute[i].tiempoInicio && 
          currentTime <= validatedRoute[i + 1].tiempoInicio) {
        currentNode = validatedRoute[i];
        nextNode = validatedRoute[i + 1];
        break;
      }
    }
  
    // Si tenemos dos nodos, interpolar
    if (nextNode && currentTime >= currentNode.tiempoInicio && currentTime <= nextNode.tiempoInicio) {
      return interpolatePosition(
        { x: currentNode.x, y: currentNode.y, time: currentNode.tiempoInicio },
        { x: nextNode.x, y: nextNode.y, time: nextNode.tiempoInicio },
        currentTime
      );
    }
  
    // Usar el nodo más cercano
    const closestNode = getClosestRouteNode(validatedRoute, currentTime);
    return closestNode ? { x: closestNode.x, y: closestNode.y } : { x: MAP_BOUNDS.MIN_X, y: MAP_BOUNDS.MIN_Y };
  };
  
  // Función para validar datos de camión
  export const validateTruckData = (truck: any): boolean => {
    if (!truck) {
      console.error('🚚 Datos de camión nulos o indefinidos');
      return false;
    }
  
    if (!truck.codigo && !truck.id) {
      console.error('🚚 Camión sin código o ID:', truck);
      return false;
    }
  
    if (truck.ubicacionActual && !isValidPositionObj(truck.ubicacionActual)) {
      console.warn(`🚚 ${truck.codigo}: Ubicación actual fuera de límites`, truck.ubicacionActual);
    }
  
    if (truck.route && Array.isArray(truck.route)) {
      const invalidNodes = truck.route.filter((node: any) => !isValidPosition(node.x, node.y));
      if (invalidNodes.length > 0) {
        console.warn(`🚚 ${truck.codigo}: ${invalidNodes.length} nodos de ruta fuera de límites`);
      }
    }
  
    return true;
  };
  
  // Función para generar posición aleatoria válida (útil para testing)
  export const generateRandomValidPosition = (): Position => {
    return {
      x: Math.random() * (MAP_BOUNDS.MAX_X - MAP_BOUNDS.MIN_X) + MAP_BOUNDS.MIN_X,
      y: Math.random() * (MAP_BOUNDS.MAX_Y - MAP_BOUNDS.MIN_Y) + MAP_BOUNDS.MIN_Y
    };
  };
  
  // Función para formatear posición para display
  export const formatPosition = (position: Position, decimals: number = 1): string => {
    const clampedPos = clampToMapBounds(position.x, position.y);
    return `(${clampedPos.x.toFixed(decimals)}, ${clampedPos.y.toFixed(decimals)})`;
  };
  
  // Función para verificar si un área rectangular está dentro de los límites
  export const isAreaWithinBounds = (
    topLeft: Position,
    bottomRight: Position
  ): boolean => {
    return isValidPositionObj(topLeft) && isValidPositionObj(bottomRight) &&
           topLeft.x <= bottomRight.x && topLeft.y >= bottomRight.y;
  };
  
  // Exportar constantes para fácil acceso
  export const MAP_INFO = {
    TOTAL_CELLS: MAP_BOUNDS.MAX_X * MAP_BOUNDS.MAX_Y,
    WIDTH_CELLS: MAP_BOUNDS.MAX_X,
    HEIGHT_CELLS: MAP_BOUNDS.MAX_Y,
    AREA_KM2: (MAP_BOUNDS.MAX_X * MAP_BOUNDS.MAX_Y) * 0.01, // Asumiendo cada celda = 100m²
    CENTER: {
      x: MAP_BOUNDS.MAX_X / 2,
      y: MAP_BOUNDS.MAX_Y / 2
    }
  } as const;