// config/mapConfig.ts
// Configuración central para el sistema de mapas

export const MAP_CONFIG = {
    // Dimensiones del grid
    GRID: {
      WIDTH: 70,          // Ancho en unidades del grid
      HEIGHT: 50,         // Alto en unidades del grid
      CELL_SIZE: 40,      // Tamaño de cada celda en píxeles
      MAIN_GRID_INTERVAL: 5, // Intervalo para líneas principales
    },
  
    // Límites y validación
    BOUNDS: {
      MIN_X: 0,
      MAX_X: 70,
      MIN_Y: 0,
      MAX_Y: 50,
    },
  
    // Configuración de zoom
    ZOOM: {
      MIN: 0.1,           // Zoom mínimo (10%)
      MAX: 3.0,           // Zoom máximo (300%)
      DEFAULT: 0.8,       // Zoom por defecto (80%)
      STEP: 1.2,          // Factor de incremento/decremento
    },
  
    // Configuración de animación
    ANIMATION: {
      DEFAULT_SPEED: 0.3,     // Velocidad por defecto
      MIN_SPEED: 0.1,         // Velocidad mínima
      MAX_SPEED: 10.0,        // Velocidad máxima
      FRAME_RATE: 20,         // FPS para animaciones (50ms)
      EASING: 'easeOut' as const, // Tipo de easing por defecto
    },
  
    // Configuración de camiones
    TRUCKS: {
      SIZE: 40,               // Tamaño del ícono en píxeles
      BORDER_WIDTH: 3,        // Grosor del borde
      ANIMATION_THRESHOLD: 0.1, // Distancia mínima para considerar movimiento
      STATUS_COLORS: {
        TA: '#3B82F6',        // Azul
        TB: '#10B981',        // Verde
        TC: '#F59E0B',        // Amarillo
        TD: '#EF4444',        // Rojo
        BROKEN: '#DC2626',    // Rojo oscuro para averías
        DEFAULT: '#6B7280',   // Gris por defecto
      },
      VALIDATION: {
        LOG_CORRECTIONS: true,    // Registrar correcciones en consola
        SHOW_WARNINGS: true,      // Mostrar advertencias de validación
        AUTO_CORRECT: true,       // Corregir automáticamente posiciones inválidas
        STRICT_MODE: false,       // Modo estricto (rechazar datos inválidos)
      }
    },
  
    // Configuración de temas
    THEMES: {
      LIGHT: {
        background: 'bg-white',
        gridColor: '#e2e8f0',
        mainGridColor: '#cbd5e1',
        textColor: 'text-gray-900',
        borderColor: '#d1d5db',
      },
      DARK: {
        background: 'bg-gray-900',
        gridColor: '#374151',
        mainGridColor: '#4b5563',
        textColor: 'text-white',
        borderColor: '#6b7280',
      },
      SATELLITE: {
        background: 'bg-green-900',
        gridColor: '#065f46',
        mainGridColor: '#047857',
        textColor: 'text-green-100',
        borderColor: '#059669',
      },
    },
  
    // Configuración de capas
    LAYERS: {
      TRUCKS: {
        enabled: true,
        zIndex: 30,
        showTooltips: true,
        showTrails: false,
      },
      WAREHOUSES: {
        enabled: true,
        zIndex: 20,
        showLabels: true,
        showCapacity: true,
      },
      ORDERS: {
        enabled: true,
        zIndex: 25,
        showPriority: true,
        animateNew: true,
      },
      GRID: {
        enabled: true,
        zIndex: 10,
        showCoordinates: true,
        showBounds: true,
      },
    },
  
    // Configuración de UI
    UI: {
      HEADER_HEIGHT: 64,      // Altura del header en píxeles
      SIDEBAR_WIDTH: 320,     // Ancho del sidebar
      CONTROL_PANEL_WIDTH: 280, // Ancho del panel de controles
      NOTIFICATION_DURATION: 5000, // Duración de notificaciones en ms
      TOOLTIP_DELAY: 500,     // Delay para mostrar tooltips
      
      // Posiciones de controles flotantes
      CONTROLS: {
        TOP_RIGHT: { top: 20, right: 16 },
        TOP_LEFT: { top: 20, left: 16 },
        BOTTOM_RIGHT: { bottom: 16, right: 16 },
        BOTTOM_LEFT: { bottom: 16, left: 16 },
      },
    },
  
    // Configuración de rendimiento
    PERFORMANCE: {
      MAX_VISIBLE_TRUCKS: 1000,    // Máximo de camiones visibles
      RENDER_DISTANCE: 2000,       // Distancia de renderizado en píxeles
      UPDATE_INTERVAL: 50,         // Intervalo de actualización en ms
      BATCH_SIZE: 100,             // Tamaño de lote para operaciones masivas
      ENABLE_CULLING: true,        // Habilitar culling de objetos fuera de vista
      OPTIMIZE_ANIMATIONS: true,    // Optimizar animaciones automáticamente
    },
  
    // Configuración de debug
    DEBUG: {
      ENABLED: process.env.NODE_ENV === 'development',
      SHOW_VALIDATION_LOGS: true,
      SHOW_PERFORMANCE_METRICS: false,
      SHOW_COORDINATE_LABELS: false,
      HIGHLIGHT_INVALID_POSITIONS: true,
      SHOW_ROUTE_PATHS: false,
    },
  
    // Configuración de almacenes por defecto
    DEFAULT_WAREHOUSES: [
      {
        id: 'w1',
        name: 'Almacén Central',
        location: { x: 35, y: 25 }, // Centro del mapa
        capacity: 1000,
        type: 'central',
      },
      {
        id: 'w2',
        name: 'Almacén Norte',
        location: { x: 35, y: 45 },
        capacity: 500,
        type: 'regional',
      },
      {
        id: 'w3',
        name: 'Almacén Sur',
        location: { x: 35, y: 5 },
        capacity: 500,
        type: 'regional',
      },
    ],
  
    // Configuración de validación
    VALIDATION: {
      POSITION: {
        TOLERANCE: 0.001,         // Tolerancia para comparaciones de posición
        AUTO_CLAMP: true,         // Forzar posiciones dentro de límites
        LOG_CORRECTIONS: true,     // Registrar correcciones
        WARN_ON_INVALID: true,     // Advertir sobre posiciones inválidas
      },
      ROUTE: {
        MIN_NODES: 1,             // Mínimo de nodos en una ruta
        MAX_NODES: 1000,          // Máximo de nodos en una ruta
        VALIDATE_TIMING: true,     // Validar tiempos de los nodos
        INTERPOLATE_MISSING: true, // Interpolar nodos faltantes
      },
      TRUCK: {
        REQUIRE_ID: true,         // Requerir ID o código
        VALIDATE_CAPACITY: true,   // Validar capacidad vs carga
        CHECK_FUEL: false,        // Validar combustible
        REQUIRE_ROUTE: false,     // Requerir ruta válida
      },
    },
  
    // Mensajes de error y advertencia
    MESSAGES: {
      ERRORS: {
        INVALID_POSITION: 'Posición fuera de los límites del mapa',
        MISSING_TRUCK_ID: 'Camión sin identificador válido',
        INVALID_ROUTE: 'Ruta contiene nodos inválidos',
        SIMULATION_ERROR: 'Error en la simulación',
      },
      WARNINGS: {
        POSITION_CORRECTED: 'Posición corregida automáticamente',
        ROUTE_VALIDATED: 'Ruta validada y corregida',
        PERFORMANCE_WARNING: 'Rendimiento comprometido - demasiados elementos',
      },
      INFO: {
        SIMULATION_LOADED: 'Simulación cargada correctamente',
        VALIDATION_COMPLETE: 'Validación completada',
        MAP_CENTERED: 'Mapa centrado',
      },
    },
  
    // URLs y endpoints (si son necesarios)
    API: {
      BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
      ENDPOINTS: {
        SIMULATIONS: '/simulaciones',
        TRUCKS: '/camiones',
        ROUTES: '/rutas',
        ORDERS: '/pedidos',
        BREAKDOWNS: '/averias',
      },
      TIMEOUTS: {
        DEFAULT: 5000,
        VALIDATION: 10000,
        SIMULATION: 30000,
      },
    },
  } as const;
  
  // Tipos derivados de la configuración
  export type MapTheme = keyof typeof MAP_CONFIG.THEMES;
  export type TruckType = keyof typeof MAP_CONFIG.TRUCKS.STATUS_COLORS;
  export type LayerType = keyof typeof MAP_CONFIG.LAYERS;
  
  // Funciones de utilidad para la configuración
  export const getTheme = (themeName: MapTheme) => {
    return MAP_CONFIG.THEMES[themeName] || MAP_CONFIG.THEMES.LIGHT;
  };
  
  export const getTruckColor = (truckCode: string): string => {
    if (truckCode.startsWith('TA')) return MAP_CONFIG.TRUCKS.STATUS_COLORS.TA;
    if (truckCode.startsWith('TB')) return MAP_CONFIG.TRUCKS.STATUS_COLORS.TB;
    if (truckCode.startsWith('TC')) return MAP_CONFIG.TRUCKS.STATUS_COLORS.TC;
    if (truckCode.startsWith('TD')) return MAP_CONFIG.TRUCKS.STATUS_COLORS.TD;
    return MAP_CONFIG.TRUCKS.STATUS_COLORS.DEFAULT;
  };
  
  export const isProductionMode = () => {
    return process.env.NODE_ENV === 'production';
  };
  
  export const isDebugEnabled = () => {
    return MAP_CONFIG.DEBUG.ENABLED || process.env.NEXT_PUBLIC_DEBUG === 'true';
  };
  
  // Validadores de configuración
  export const validateMapConfig = (): boolean => {
    const { GRID, BOUNDS, ZOOM, ANIMATION } = MAP_CONFIG;
    
    // Validar dimensiones del grid
    if (GRID.WIDTH <= 0 || GRID.HEIGHT <= 0 || GRID.CELL_SIZE <= 0) {
      console.error('❌ Configuración de grid inválida');
      return false;
    }
    
    // Validar límites
    if (BOUNDS.MIN_X >= BOUNDS.MAX_X || BOUNDS.MIN_Y >= BOUNDS.MAX_Y) {
      console.error('❌ Límites del mapa inválidos');
      return false;
    }
    
    // Validar zoom
    if (ZOOM.MIN >= ZOOM.MAX || ZOOM.DEFAULT < ZOOM.MIN || ZOOM.DEFAULT > ZOOM.MAX) {
      console.error('❌ Configuración de zoom inválida');
      return false;
    }
    
    // Validar animación
    if (ANIMATION.MIN_SPEED >= ANIMATION.MAX_SPEED || ANIMATION.FRAME_RATE <= 0) {
      console.error('❌ Configuración de animación inválida');
      return false;
    }
    
    console.log('✅ Configuración del mapa válida');
    return true;
  };
  
  // Exportar configuración por defecto
  export default MAP_CONFIG;