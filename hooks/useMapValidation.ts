// hooks/useMapValidation.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  MAP_BOUNDS, 
  isValidPosition, 
  clampToMapBounds, 
  validateTruckData,
  getRoutePositionAtTime,
  Position,
  RouteNode
} from '../utils/mapUtils';

interface ValidationResult {
  isValid: boolean;
  correctedPosition?: Position;
  message?: string;
  severity: 'info' | 'warning' | 'error';
}

interface TruckValidationResult {
  codigo: string;
  locationValid: boolean;
  routeValid: boolean;
  correctedLocation?: Position;
  invalidRouteNodes: number;
  totalRouteNodes: number;
  messages: string[];
}

interface MapValidationState {
  totalTrucks: number;
  validTrucks: number;
  invalidTrucks: number;
  correctedTrucks: number;
  totalValidationErrors: number;
  lastValidationTime: Date | null;
}

export const useMapValidation = () => {
  const [validationState, setValidationState] = useState<MapValidationState>({
    totalTrucks: 0,
    validTrucks: 0,
    invalidTrucks: 0,
    correctedTrucks: 0,
    totalValidationErrors: 0,
    lastValidationTime: null
  });

  const [validationHistory, setValidationHistory] = useState<Array<{
    timestamp: Date;
    truckCode: string;
    type: 'position' | 'route';
    from: Position;
    to: Position;
    message: string;
  }>>([]);

  // Validar una posición individual
  const validatePosition = useCallback((x: number, y: number): ValidationResult => {
    const valid = isValidPosition(x, y);
    
    if (valid) {
      return {
        isValid: true,
        severity: 'info'
      };
    }

    const corrected = clampToMapBounds(x, y);
    const message = `Posición (${x.toFixed(2)}, ${y.toFixed(2)}) fuera de límites. Corregida a (${corrected.x.toFixed(2)}, ${corrected.y.toFixed(2)})`;
    
    return {
      isValid: false,
      correctedPosition: corrected,
      message,
      severity: 'warning'
    };
  }, []);

  // Validar una ruta completa
  const validateRoute = useCallback((route: RouteNode[]): {
    isValid: boolean;
    validNodes: number;
    invalidNodes: number;
    correctedRoute: RouteNode[];
    corrections: Array<{ nodeId: number; from: Position; to: Position }>;
  } => {
    if (!route || route.length === 0) {
      return {
        isValid: true,
        validNodes: 0,
        invalidNodes: 0,
        correctedRoute: [],
        corrections: []
      };
    }

    let validNodes = 0;
    let invalidNodes = 0;
    const corrections: Array<{ nodeId: number; from: Position; to: Position }> = [];
    
    const correctedRoute = route.map(node => {
      const validation = validatePosition(node.x, node.y);
      
      if (validation.isValid) {
        validNodes++;
        return node;
      } else {
        invalidNodes++;
        const corrected = validation.correctedPosition!;
        corrections.push({
          nodeId: node.id,
          from: { x: node.x, y: node.y },
          to: corrected
        });
        
        return {
          ...node,
          x: corrected.x,
          y: corrected.y
        };
      }
    });

    return {
      isValid: invalidNodes === 0,
      validNodes,
      invalidNodes,
      correctedRoute,
      corrections
    };
  }, [validatePosition]);

  // Validar un camión completo
  const validateTruck = useCallback((truck: any): TruckValidationResult => {
    const result: TruckValidationResult = {
      codigo: truck.codigo || truck.id || 'Sin código',
      locationValid: true,
      routeValid: true,
      invalidRouteNodes: 0,
      totalRouteNodes: 0,
      messages: []
    };

    // Validar datos básicos
    if (!validateTruckData(truck)) {
      result.locationValid = false;
      result.routeValid = false;
      result.messages.push('Datos de camión inválidos');
      return result;
    }

    // Validar ubicación actual
    if (truck.ubicacionActual) {
      const locationValidation = validatePosition(truck.ubicacionActual.x, truck.ubicacionActual.y);
      result.locationValid = locationValidation.isValid;
      
      if (!locationValidation.isValid) {
        result.correctedLocation = locationValidation.correctedPosition;
        result.messages.push(locationValidation.message || 'Ubicación corregida');
      }
    } else {
      result.messages.push('Sin ubicación actual');
    }

    // Validar ruta
    if (truck.route && Array.isArray(truck.route)) {
      const routeValidation = validateRoute(truck.route);
      result.routeValid = routeValidation.isValid;
      result.invalidRouteNodes = routeValidation.invalidNodes;
      result.totalRouteNodes = truck.route.length;
      
      if (!routeValidation.isValid) {
        result.messages.push(`${routeValidation.invalidNodes} nodos de ruta corregidos`);
      }
    }

    return result;
  }, [validatePosition, validateRoute]);

  // Validar un array de camiones
  const validateTruckArray = useCallback((trucks: any[]): {
    results: TruckValidationResult[];
    correctedTrucks: any[];
    summary: MapValidationState;
  } => {
    const results: TruckValidationResult[] = [];
    const correctedTrucks: any[] = [];
    let totalErrors = 0;
    let correctedCount = 0;

    trucks.forEach(truck => {
      const validation = validateTruck(truck);
      results.push(validation);

      // Crear versión corregida del camión
      const correctedTruck = { ...truck };
      let truckCorrected = false;

      // Corregir ubicación actual si es necesario
      if (validation.correctedLocation) {
        correctedTruck.ubicacionActual = {
          ...correctedTruck.ubicacionActual,
          ...validation.correctedLocation
        };
        truckCorrected = true;
        totalErrors++;

        // Agregar al historial
        setValidationHistory(prev => [...prev.slice(-49), {
          timestamp: new Date(),
          truckCode: validation.codigo,
          type: 'position',
          from: { x: truck.ubicacionActual.x, y: truck.ubicacionActual.y },
          to: validation.correctedLocation!,
          message: 'Ubicación actual corregida'
        }]);
      }

      // Corregir ruta si es necesario
      if (correctedTruck.route && validation.invalidRouteNodes > 0) {
        const routeValidation = validateRoute(correctedTruck.route);
        correctedTruck.route = routeValidation.correctedRoute;
        truckCorrected = true;
        totalErrors += validation.invalidRouteNodes;

        // Agregar correcciones al historial
        routeValidation.corrections.forEach(correction => {
          setValidationHistory(prev => [...prev.slice(-49), {
            timestamp: new Date(),
            truckCode: validation.codigo,
            type: 'route',
            from: correction.from,
            to: correction.to,
            message: `Nodo ${correction.nodeId} corregido`
          }]);
        });
      }

      if (truckCorrected) {
        correctedCount++;
      }

      correctedTrucks.push(correctedTruck);
    });

    const validTrucks = results.filter(r => r.locationValid && r.routeValid).length;
    const summary: MapValidationState = {
      totalTrucks: trucks.length,
      validTrucks,
      invalidTrucks: trucks.length - validTrucks,
      correctedTrucks: correctedCount,
      totalValidationErrors: totalErrors,
      lastValidationTime: new Date()
    };

    setValidationState(summary);

    return {
      results,
      correctedTrucks,
      summary
    };
  }, [validateTruck, validateRoute]);

  // Obtener posición segura para un camión en un tiempo específico
  const getSafeTruckPosition = useCallback((truck: any, currentTime: number): Position => {
    // Si no tiene ruta, usar ubicación actual (validada)
    if (!truck.route || truck.route.length === 0) {
      if (truck.ubicacionActual) {
        return clampToMapBounds(truck.ubicacionActual.x, truck.ubicacionActual.y);
      }
      // Posición por defecto si no hay datos
      return { x: MAP_BOUNDS.MIN_X, y: MAP_BOUNDS.MIN_Y };
    }

    // Validar ruta y obtener posición interpolada
    const routeValidation = validateRoute(truck.route);
    const position = getRoutePositionAtTime(routeValidation.correctedRoute, currentTime);
    
    return clampToMapBounds(position.x, position.y);
  }, [validateRoute]);

  // Verificar si un área está dentro de los límites
  const isAreaWithinBounds = useCallback((
    topLeft: Position,
    bottomRight: Position
  ): boolean => {
    return isValidPosition(topLeft.x, topLeft.y) && 
           isValidPosition(bottomRight.x, bottomRight.y) &&
           topLeft.x <= bottomRight.x && 
           topLeft.y >= bottomRight.y;
  }, []);

  // Obtener estadísticas de validación
  const getValidationStats = useCallback(() => {
    return {
      ...validationState,
      recentCorrections: validationHistory.slice(-10),
      totalCorrections: validationHistory.length
    };
  }, [validationState, validationHistory]);

  // Limpiar historial de validación
  const clearValidationHistory = useCallback(() => {
    setValidationHistory([]);
  }, []);

  // Detectar camiones problemáticos
  const getProblematicTrucks = useCallback((trucks: any[]): Array<{
    codigo: string;
    issues: string[];
    severity: 'low' | 'medium' | 'high';
  }> => {
    return trucks.map(truck => {
      const validation = validateTruck(truck);
      const issues: string[] = [];
      let severity: 'low' | 'medium' | 'high' = 'low';

      if (!validation.locationValid) {
        issues.push('Ubicación fuera de límites');
        severity = 'high';
      }

      if (!validation.routeValid) {
        issues.push(`${validation.invalidRouteNodes} nodos de ruta inválidos`);
        if (validation.invalidRouteNodes > validation.totalRouteNodes * 0.5) {
          severity = 'high';
        } else if (validation.invalidRouteNodes > 0) {
          severity = severity === 'high' ? 'high' : 'medium';
        }
      }

      if (!truck.codigo && !truck.id) {
        issues.push('Sin identificador');
        severity = 'high';
      }

      return {
        codigo: validation.codigo,
        issues,
        severity
      };
    }).filter(result => result.issues.length > 0);
  }, [validateTruck]);

  return {
    // Estados
    validationState,
    validationHistory,
    
    // Funciones de validación
    validatePosition,
    validateRoute,
    validateTruck,
    validateTruckArray,
    
    // Utilidades
    getSafeTruckPosition,
    isAreaWithinBounds,
    getValidationStats,
    clearValidationHistory,
    getProblematicTrucks,
    
    // Constantes
    MAP_BOUNDS
  };
};

export default useMapValidation;