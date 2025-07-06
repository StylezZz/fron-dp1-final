'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, Minus, Home, Truck, Package, MapPin, Navigation, Settings, Filter, Eye, EyeOff, Layers, Target, Zap, AlertTriangle, CheckCircle, Clock, Play, Pause, RotateCcw, Maximize, Minimize, List, Grid, Network, Wrench, AlertCircle, Bell, TrendingUp, BarChart3, Activity, Workflow, Zap as Lightning, Users, MapPin as Pin } from 'lucide-react';

// Tipos basados en tu estructura actual
interface MapPosition {
  x: number;
  y: number;
}

interface Order {
  id: string;
  location: { lat: number; lng: number };
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer: string;
  volume: number;
  assignedTruck?: string;
  estimatedTime?: number;
  zone?: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: { x: number; y: number };
  capacity: number;
  currentStock: number;
}

interface Truck {
  id: string;
  location: { x: number; y: number };
  status: 'available' | 'in_route' | 'loading' | 'maintenance' | 'broken';
  capacity: number;
  currentLoad: number;
  route?: { x: number; y: number }[];
  assignedOrders?: string[];
  lastMaintenance?: string;
  breakdownRisk?: number;
}

interface Route {
  id: string;
  startLocation: { x: number; y: number };
  endLocation: { x: number; y: number };
  waypoints: { x: number; y: number }[];
  truckId: string;
  color: string;
}

interface AnimationState {
  isPlaying: boolean;
  speed: number;
  currentTime: number;
}

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  timestamp: number;
}

interface Zone {
  id: string;
  name: string;
  orders: Order[];
  averagePriority: number;
  center: { x: number; y: number };
}

const ImprovedLogisticsMap: React.FC = () => {
  // Estados del mapa
  const [mapPosition, setMapPosition] = useState<MapPosition>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark' | 'satellite'>('light');
  
  // Estados de visualización avanzados
  const [showOrders, setShowOrders] = useState(true);
  const [showTrucks, setShowTrucks] = useState(true);
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Estados de animación y tiempo real
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    speed: 1,
    currentTime: 0
  });
  
  // Estados de panel
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const [orderViewMode, setOrderViewMode] = useState<'list' | 'timeline' | 'zones' | 'network'>('list');
  
  // Estados de notificaciones y averías
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Referencias
  const mapRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Datos de ejemplo basados en tu estructura (con mejoras)
  const [warehouses] = useState<Warehouse[]>([
    { id: '1', name: 'Almacén Central', location: { x: 12, y: 8 }, capacity: 1000, currentStock: 750 },
    { id: '2', name: 'Almacén Norte', location: { x: 25, y: 35 }, capacity: 500, currentStock: 300 },
    { id: '3', name: 'Almacén Sur', location: { x: 8, y: 5 }, capacity: 300, currentStock: 200 }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: '1', location: { lat: 20, lng: 15 }, status: 'pending', priority: 'high', customer: 'Cliente A', volume: 100, zone: 'Norte', estimatedTime: 45 },
    { id: '2', location: { lat: 30, lng: 25 }, status: 'assigned', priority: 'urgent', customer: 'Cliente B', volume: 150, assignedTruck: '1', zone: 'Norte', estimatedTime: 30 },
    { id: '3', location: { lat: 10, lng: 35 }, status: 'in_transit', priority: 'medium', customer: 'Cliente C', volume: 75, assignedTruck: '2', zone: 'Sur', estimatedTime: 60 },
    { id: '4', location: { lat: 18, lng: 8 }, status: 'delivered', priority: 'low', customer: 'Cliente D', volume: 200, zone: 'Centro', estimatedTime: 0 },
    { id: '5', location: { lat: 22, lng: 20 }, status: 'pending', priority: 'urgent', customer: 'Cliente E', volume: 125, zone: 'Norte', estimatedTime: 25 },
    { id: '6', location: { lat: 14, lng: 12 }, status: 'assigned', priority: 'high', customer: 'Cliente F', volume: 80, assignedTruck: '3', zone: 'Centro', estimatedTime: 40 }
  ]);

  const [trucks, setTrucks] = useState<Truck[]>([
    { 
      id: '1', 
      location: { x: 15, y: 12 }, 
      status: 'available', 
      capacity: 500, 
      currentLoad: 0,
      route: [{ x: 15, y: 12 }, { x: 20, y: 15 }, { x: 25, y: 20 }],
      assignedOrders: [],
      lastMaintenance: '2024-01-15',
      breakdownRisk: 15
    },
    { 
      id: '2', 
      location: { x: 22, y: 28 }, 
      status: 'in_route', 
      capacity: 500, 
      currentLoad: 300,
      route: [{ x: 22, y: 28 }, { x: 18, y: 25 }, { x: 12, y: 20 }],
      assignedOrders: ['3'],
      lastMaintenance: '2024-01-10',
      breakdownRisk: 25
    },
    { 
      id: '3', 
      location: { x: 8, y: 6 }, 
      status: 'loading', 
      capacity: 300, 
      currentLoad: 100,
      route: [{ x: 8, y: 6 }, { x: 12, y: 8 }, { x: 20, y: 15 }],
      assignedOrders: ['6'],
      lastMaintenance: '2024-01-20',
      breakdownRisk: 8
    }
  ]);

  const routes: Route[] = [
    {
      id: 'route1',
      startLocation: { x: 12, y: 8 },
      endLocation: { x: 20, y: 15 },
      waypoints: [{ x: 15, y: 10 }, { x: 18, y: 12 }],
      truckId: '1',
      color: '#3b82f6'
    },
    {
      id: 'route2', 
      startLocation: { x: 25, y: 35 },
      endLocation: { x: 30, y: 25 },
      waypoints: [{ x: 28, y: 30 }],
      truckId: '2',
      color: '#ef4444'
    }
  ];

  // Función para añadir notificaciones
  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 5));
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Función para averiar camión
  const breakdownTruck = useCallback((truckId: string) => {
    setTrucks(prev => prev.map(truck => {
      if (truck.id === truckId) {
        // Reasignar pedidos automáticamente
        const affectedOrders = orders.filter(order => order.assignedTruck === truckId);
        if (affectedOrders.length > 0) {
          // Buscar camión disponible
          const availableTruck = prev.find(t => t.id !== truckId && t.status === 'available' && t.currentLoad + affectedOrders.reduce((sum, o) => sum + o.volume, 0) <= t.capacity);
          
          if (availableTruck) {
            // Reasignar pedidos
            setOrders(prevOrders => prevOrders.map(order => 
              affectedOrders.includes(order) 
                ? { ...order, assignedTruck: availableTruck.id, status: 'assigned' as const }
                : order
            ));
            addNotification('warning', `Camión ${truckId} averiado. Pedidos reasignados a Camión ${availableTruck.id}`);
          } else {
            // No hay camiones disponibles
            setOrders(prevOrders => prevOrders.map(order => 
              affectedOrders.includes(order) 
                ? { ...order, assignedTruck: undefined, status: 'pending' as const }
                : order
            ));
            addNotification('error', `Camión ${truckId} averiado. No hay camiones disponibles para reasignar ${affectedOrders.length} pedido(s)`);
          }
        }
        
        return { 
          ...truck, 
          status: 'broken' as const,
          currentLoad: 0,
          assignedOrders: []
        };
      }
      return truck;
    }));
  }, [orders, addNotification]);

  // Función para reparar camión
  const repairTruck = useCallback((truckId: string) => {
    setTrucks(prev => prev.map(truck => 
      truck.id === truckId 
        ? { ...truck, status: 'available' as const, breakdownRisk: 5 }
        : truck
    ));
    addNotification('success', `Camión ${truckId} reparado y disponible`);
  }, [addNotification]);

  // Calcular zonas de pedidos
  const calculateZones = useCallback((): Zone[] => {
    const zoneMap = new Map<string, Order[]>();
    
    orders.forEach(order => {
      const zone = order.zone || 'Sin zona';
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, []);
      }
      zoneMap.get(zone)!.push(order);
    });

    return Array.from(zoneMap.entries()).map(([zoneName, zoneOrders]) => {
      const center = zoneOrders.reduce(
        (acc, order) => ({
          x: acc.x + order.location.lng,
          y: acc.y + order.location.lat
        }),
        { x: 0, y: 0 }
      );
      
      const avgPriority = zoneOrders.reduce((sum, order) => {
        const priorityValue = { low: 1, medium: 2, high: 3, urgent: 4 }[order.priority];
        return sum + priorityValue;
      }, 0) / zoneOrders.length;

      return {
        id: zoneName.toLowerCase().replace(' ', '_'),
        name: zoneName,
        orders: zoneOrders,
        averagePriority: avgPriority,
        center: {
          x: center.x / zoneOrders.length,
          y: center.y / zoneOrders.length
        }
      };
    });
  }, [orders]);

  // Manejo de zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  // Manejo de arrastre
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y };
  }, [mapPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragStartRef.current) {
      setMapPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Centrar mapa
  const centerMap = useCallback(() => {
    setMapPosition({ x: 0, y: 0 });
    setZoomLevel(1);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Funciones de animación
  const toggleAnimation = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const resetAnimation = useCallback(() => {
    setAnimationState(prev => ({ ...prev, currentTime: 0, isPlaying: false }));
  }, []);

  // Efectos de animación
  useEffect(() => {
    if (animationState.isPlaying) {
      const interval = setInterval(() => {
        setAnimationState(prev => ({
          ...prev,
          currentTime: (prev.currentTime + prev.speed) % 100
        }));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [animationState.isPlaying, animationState.speed]);

  // Obtener color basado en prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Obtener color basado en estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-400';
      case 'assigned': return 'bg-blue-500';
      case 'in_transit': return 'bg-purple-500';
      case 'delivered': return 'bg-green-600';
      case 'available': return 'bg-green-500';
      case 'loading': return 'bg-yellow-500';
      case 'maintenance': return 'bg-orange-500';
      case 'broken': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = !searchQuery || order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  // Obtener tema del mapa
  const getMapTheme = () => {
    switch (mapTheme) {
      case 'dark':
        return {
          background: 'bg-gray-900',
          gridColor: '#374151',
          mainGridColor: '#4b5563',
          textColor: 'text-white'
        };
      case 'satellite':
        return {
          background: 'bg-green-900',
          gridColor: '#065f46', 
          mainGridColor: '#047857',
          textColor: 'text-green-100'
        };
      default:
        return {
          background: 'bg-white',
          gridColor: '#e2e8f0',
          mainGridColor: '#cbd5e1',
          textColor: 'text-gray-900'
        };
    }
  };

  const theme = getMapTheme();
  const zones = calculateZones();

  return (
    <div className={`w-full h-screen relative ${theme.background} overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Barra superior moderna */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Mapa Logístico Inteligente</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>En vivo</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 hover:bg-gray-100 rounded-lg relative ${notifications.length > 0 ? 'text-red-600' : ''}`}
              title="Notificaciones"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </div>
              )}
            </button>
            
            {/* Panel de notificaciones */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-60">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">Notificaciones</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map(notification => (
                      <div key={notification.id} className="p-3">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controles de animación */}
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border px-2 py-1">
            <button
              onClick={toggleAnimation}
              className="p-1 hover:bg-gray-100 rounded"
              title={animationState.isPlaying ? "Pausar" : "Reproducir"}
            >
              {animationState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={resetAnimation}
              className="p-1 hover:bg-gray-100 rounded"
              title="Reiniciar"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Selector de tema */}
          <select
            value={mapTheme}
            onChange={(e) => setMapTheme(e.target.value as 'light' | 'dark' | 'satellite')}
            className="px-3 py-1 bg-white border rounded-lg text-sm"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="satellite">Satélite</option>
          </select>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Panel lateral de pedidos INNOVADOR */}
      {showOrderPanel && (
        <div className="absolute top-16 left-0 w-96 h-full bg-white/95 backdrop-blur-md border-r border-gray-200 z-40 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Gestión de Pedidos
              </h3>
              <button
                onClick={() => setShowOrderPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <EyeOff size={16} />
              </button>
            </div>
            
            {/* Selector de modo de vista */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setOrderViewMode('list')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${orderViewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List size={14} />
                Lista
              </button>
              <button
                onClick={() => setOrderViewMode('timeline')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${orderViewMode === 'timeline' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Activity size={14} />
                Línea
              </button>
              <button
                onClick={() => setOrderViewMode('zones')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${orderViewMode === 'zones' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Pin size={14} />
                Zonas
              </button>
              <button
                onClick={() => setOrderViewMode('network')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${orderViewMode === 'network' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Network size={14} />
                Red
              </button>
            </div>
          </div>

          <div className="h-full overflow-y-auto pb-20">
            {/* Vista Lista */}
            {orderViewMode === 'list' && (
              <div className="p-4 space-y-3">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${selectedElement === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    onClick={() => setSelectedElement(order.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`}></div>
                        <span className="font-medium text-sm">{order.customer}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)} text-white`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Vol: {order.volume}L • Zona: {order.zone}</div>
                      <div>Est: {order.estimatedTime}min</div>
                      {order.assignedTruck && (
                        <div className="flex items-center gap-1">
                          <Truck size={12} />
                          Camión {order.assignedTruck}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista Timeline */}
            {orderViewMode === 'timeline' && (
              <div className="p-4">
                <div className="relative">
                  {/* Línea vertical */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  
                  {filteredOrders
                    .sort((a, b) => (a.estimatedTime || 0) - (b.estimatedTime || 0))
                    .map((order, index) => (
                      <div key={order.id} className="relative flex items-center mb-6">
                        {/* Punto en la línea */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${getPriorityColor(order.priority)}`}></div>
                        
                        {/* Contenido */}
                        <div className="ml-10 bg-white rounded-lg border p-3 shadow-sm flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">{order.customer}</div>
                              <div className="text-xs text-gray-600">
                                {order.estimatedTime}min • {order.volume}L
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.zone}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Vista Zonas */}
            {orderViewMode === 'zones' && (
              <div className="p-4 space-y-4">
                {zones.map(zone => (
                  <div key={zone.id} className="bg-white rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          zone.averagePriority > 3 ? 'bg-red-500' :
                          zone.averagePriority > 2.5 ? 'bg-orange-500' :
                          zone.averagePriority > 2 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        {zone.name}
                      </h4>
                      <span className="text-sm text-gray-600">{zone.orders.length} pedidos</span>
                    </div>
                    
                    <div className="space-y-2">
                      {zone.orders.slice(0, 3).map(order => (
                        <div key={order.id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span>{order.customer}</span>
                            <span className="text-gray-500">{order.volume}L</span>
                          </div>
                        </div>
                      ))}
                      {zone.orders.length > 3 && (
                        <div className="text-xs text-center text-gray-500">
                          +{zone.orders.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista Red */}
            {orderViewMode === 'network' && (
              <div className="p-4">
                <div className="bg-white rounded-lg border p-4 text-center">
                  <Network size={48} className="mx-auto text-gray-400 mb-3" />
                  <h4 className="font-medium mb-2">Vista de Red Inteligente</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualiza conexiones entre pedidos, camiones y rutas optimizadas
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conexiones activas:</span>
                      <span className="font-medium">{trucks.filter(t => t.assignedOrders?.length).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Eficiencia promedio:</span>
                      <span className="font-medium text-green-600">87%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tiempo promedio:</span>
                      <span className="font-medium">{Math.round(filteredOrders.reduce((sum, o) => sum + (o.estimatedTime || 0), 0) / filteredOrders.length)}min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConnections(!showConnections)}
                    className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    {showConnections ? 'Ocultar' : 'Mostrar'} Conexiones
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel de gestión de flota */}
      {showFleetPanel && (
        <div className="absolute top-16 right-0 w-80 h-full bg-white/95 backdrop-blur-md border-l border-gray-200 z-40 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Truck size={20} className="text-green-600" />
                Gestión de Flota
              </h3>
              <button
                onClick={() => setShowFleetPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <EyeOff size={16} />
              </button>
            </div>
          </div>

          <div className="h-full overflow-y-auto pb-20 p-4">
            <div className="space-y-4">
              {trucks.map(truck => (
                <div key={truck.id} className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(truck.status)}`}></div>
                      <span className="font-semibold">Camión {truck.id}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(truck.status)}`}>
                      {truck.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Carga:</span>
                      <span>{truck.currentLoad}/{truck.capacity}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pedidos asignados:</span>
                      <span>{truck.assignedOrders?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Riesgo de avería:</span>
                      <span className={`font-medium ${
                        truck.breakdownRisk! > 30 ? 'text-red-600' :
                        truck.breakdownRisk! > 15 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {truck.breakdownRisk}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Último mant.:</span>
                      <span className="text-gray-600">{truck.lastMaintenance}</span>
                    </div>
                  </div>

                  {/* Barra de progreso de carga */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Capacidad utilizada</span>
                      <span>{((truck.currentLoad / truck.capacity) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${truck.currentLoad / truck.capacity > 0.8 ? 'bg-red-500' : truck.currentLoad / truck.capacity > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${(truck.currentLoad / truck.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-3 flex gap-2">
                    {truck.status === 'broken' ? (
                      <button
                        onClick={() => repairTruck(truck.id)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                      >
                        <Wrench size={14} />
                        Reparar
                      </button>
                    ) : (
                      <button
                        onClick={() => breakdownTruck(truck.id)}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                      >
                        <AlertCircle size={14} />
                        Averiar
                      </button>
                    )}
                    <button className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de flota */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 size={16} />
                Resumen de Flota
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total camiones:</span>
                  <span className="font-medium">{trucks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disponibles:</span>
                  <span className="font-medium text-green-600">{trucks.filter(t => t.status === 'available').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>En ruta:</span>
                  <span className="font-medium text-blue-600">{trucks.filter(t => t.status === 'in_route').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Averiados:</span>
                  <span className="font-medium text-red-600">{trucks.filter(t => t.status === 'broken').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilización promedio:</span>
                  <span className="font-medium">
                    {((trucks.reduce((sum, t) => sum + (t.currentLoad / t.capacity), 0) / trucks.length) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles flotantes izquierda */}
      <div className="absolute top-20 left-4 z-40 flex flex-col gap-2">
        {/* Controles de navegación */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 hover:bg-blue-100 rounded-lg transition-colors ${showSearch ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Buscar"
          >
            <Search size={20} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Acercar"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Alejar"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={centerMap}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Centrar mapa"
          >
            <Target size={20} />
          </button>
        </div>

        {/* Controles de paneles */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={() => setShowOrderPanel(!showOrderPanel)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showOrderPanel ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Panel de pedidos"
          >
            <Package size={20} />
          </button>
          <button
            onClick={() => setShowFleetPanel(!showFleetPanel)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showFleetPanel ? 'bg-green-100 text-green-600' : ''}`}
            title="Panel de flota"
          >
            <Truck size={20} />
          </button>
          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showControlPanel ? 'bg-purple-100 text-purple-600' : ''}`}
            title="Panel de control"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Controles de capas */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showHeatmap ? 'bg-orange-100 text-orange-600' : ''}`}
            title="Mapa de calor"
          >
            <Zap size={20} />
          </button>
          <button
            onClick={() => setShowConnections(!showConnections)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showConnections ? 'bg-purple-100 text-purple-600' : ''}`}
            title="Conexiones"
          >
            <Network size={20} />
          </button>
          <button
            onClick={() => setShowZones(!showZones)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showZones ? 'bg-cyan-100 text-cyan-600' : ''}`}
            title="Zonas"
          >
            <Pin size={20} />
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showLegend ? 'bg-green-100 text-green-600' : ''}`}
            title="Leyenda"
          >
            <Layers size={20} />
          </button>
        </div>
      </div>

      {/* Panel de control mejorado (solo mostrar cuando no hay paneles laterales) */}
      {showControlPanel && !showOrderPanel && !showFleetPanel && (
        <div className="absolute top-20 right-4 z-40 bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-6 w-80 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Centro de Control</h3>
            <button
              onClick={() => setShowControlPanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Eye size={16} />
            </button>
          </div>
          
          {/* Pestañas */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${showMetrics ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              Métricas
            </button>
            <button className="flex-1 py-2 px-3 rounded-md text-sm font-medium bg-white shadow-sm">
              Filtros
            </button>
          </div>

          {showMetrics ? (
            /* Panel de métricas mejorado */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
                  <div className="text-xs text-blue-600">Pedidos activos</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{trucks.filter(t => t.status !== 'maintenance' && t.status !== 'broken').length}</div>
                  <div className="text-xs text-green-600">Camiones operativos</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{warehouses.length}</div>
                  <div className="text-xs text-purple-600">Almacenes</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{trucks.filter(t => t.status === 'broken').length}</div>
                  <div className="text-xs text-red-600">Camiones averiados</div>
                </div>
              </div>

              {/* Métricas adicionales */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium mb-2">Eficiencia de Flota</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilización promedio:</span>
                    <span className="font-medium">
                      {((trucks.reduce((sum, t) => sum + (t.currentLoad / t.capacity), 0) / trucks.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pedidos urgentes:</span>
                    <span className="font-medium text-red-600">
                      {filteredOrders.filter(o => o.priority === 'urgent').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tiempo promedio:</span>
                    <span className="font-medium">
                      {Math.round(filteredOrders.reduce((sum, o) => sum + (o.estimatedTime || 0), 0) / filteredOrders.length)}min
                    </span>
                  </div>
                </div>
              </div>

              {/* Progreso de animación */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de simulación</span>
                  <span>{animationState.currentTime.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${animationState.currentTime}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            /* Panel de filtros */
            <div className="space-y-4">
              {/* Toggles de elementos con iconos */}
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-blue-600" />
                    <span>Pedidos</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showOrders}
                      onChange={(e) => setShowOrders(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setShowOrders(!showOrders)}
                      className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${showOrders ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showOrders ? 'translate-x-6' : 'translate-x-1'} mt-1`}></div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck size={16} className="text-green-600" />
                    <span>Camiones</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showTrucks}
                      onChange={(e) => setShowTrucks(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setShowTrucks(!showTrucks)}
                      className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${showTrucks ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showTrucks ? 'translate-x-6' : 'translate-x-1'} mt-1`}></div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Home size={16} className="text-purple-600" />
                    <span>Almacenes</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showWarehouses}
                      onChange={(e) => setShowWarehouses(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setShowWarehouses(!showWarehouses)}
                      className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${showWarehouses ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showWarehouses ? 'translate-x-6' : 'translate-x-1'} mt-1`}></div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Navigation size={16} className="text-orange-600" />
                    <span>Rutas</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showRoutes}
                      onChange={(e) => setShowRoutes(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setShowRoutes(!showRoutes)}
                      className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${showRoutes ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showRoutes ? 'translate-x-6' : 'translate-x-1'} mt-1`}></div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Filtros mejorados */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridad</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="urgent">🔴 Urgente</option>
                    <option value="high">🟠 Alta</option>
                    <option value="medium">🟡 Media</option>
                    <option value="low">🟢 Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">⏳ Pendiente</option>
                    <option value="assigned">📋 Asignado</option>
                    <option value="in_transit">🚛 En tránsito</option>
                    <option value="delivered">✅ Entregado</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel de búsqueda mejorado */}
      {showSearch && (
        <div className="absolute top-20 left-20 z-40 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl w-96 border border-gray-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar pedidos, clientes, camiones..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {searchQuery && (
            <div className="max-h-60 overflow-y-auto space-y-1">
              <div className="text-xs text-gray-500 mb-2">Resultados de búsqueda:</div>
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-gray-100 transition-colors"
                  onClick={() => {
                    setSelectedElement(order.id);
                    setSearchQuery('');
                    setShowSearch(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{order.customer}</div>
                      <div className="text-sm text-gray-600">Vol: {order.volume}L</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`}></div>
                      <span className="text-xs text-gray-500">{order.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredOrders.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No se encontraron resultados
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenedor principal del mapa */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-grab mt-16"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Cuadrícula con tema */}
        <div
          className={`absolute inset-0 ${theme.background}`}
          style={{
            backgroundSize: `${40 * zoomLevel}px ${40 * zoomLevel}px`,
            backgroundImage: `
              linear-gradient(to right, ${theme.gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${theme.gridColor} 1px, transparent 1px)
            `,
            backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`,
          }}
        >
          {/* Líneas principales cada 5 unidades */}
          <div
            className="absolute inset-0"
            style={{
              backgroundSize: `${40 * 5 * zoomLevel}px ${40 * 5 * zoomLevel}px`,
              backgroundImage: `
                linear-gradient(to right, ${theme.mainGridColor} 2px, transparent 2px),
                linear-gradient(to bottom, ${theme.mainGridColor} 2px, transparent 2px)
              `,
              backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`,
            }}
          />

          {/* Mapa de calor */}
          {showHeatmap && (
            <div className="absolute inset-0 pointer-events-none">
              {filteredOrders.map(order => (
                <div
                  key={`heatmap-${order.id}`}
                  className="absolute rounded-full opacity-30"
                  style={{
                    left: `${(order.location.lng * 40 + mapPosition.x) * zoomLevel}px`,
                    bottom: `${(order.location.lat * 40 + mapPosition.y) * zoomLevel}px`,
                    width: `${60 * zoomLevel}px`,
                    height: `${60 * zoomLevel}px`,
                    background: `radial-gradient(circle, ${order.priority === 'urgent' ? 'rgba(239, 68, 68, 0.4)' : order.priority === 'high' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)'} 0%, transparent 70%)`,
                    transform: 'translate(-50%, 50%)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Zonas de pedidos */}
          {showZones && (
            <div className="absolute inset-0 pointer-events-none">
              {zones.map(zone => (
                <div
                  key={zone.id}
                  className="absolute rounded-full border-2 border-dashed opacity-50"
                  style={{
                    left: `${(zone.center.x * 40 + mapPosition.x) * zoomLevel}px`,
                    bottom: `${(zone.center.y * 40 + mapPosition.y) * zoomLevel}px`,
                    width: `${120 * zoomLevel}px`,
                    height: `${120 * zoomLevel}px`,
                    borderColor: zone.averagePriority > 3 ? '#ef4444' :
                                zone.averagePriority > 2.5 ? '#f59e0b' :
                                zone.averagePriority > 2 ? '#eab308' : '#22c55e',
                    transform: 'translate(-50%, 50%)',
                    backgroundColor: zone.averagePriority > 3 ? 'rgba(239, 68, 68, 0.1)' :
                                    zone.averagePriority > 2.5 ? 'rgba(245, 158, 11, 0.1)' :
                                    zone.averagePriority > 2 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)'
                  }}
                >
                  <div className="absolute top-2 left-2 text-xs font-medium px-2 py-1 bg-white rounded-full">
                    {zone.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Elementos del mapa */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Conexiones entre camiones y pedidos */}
          {showConnections && (
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
                      className={animationState.isPlaying ? 'animate-pulse' : ''}
                    />
                  );
                })
              )}
            </svg>
          )}

          {/* Rutas animadas */}
          {showRoutes && routes.map(route => (
            <svg
              key={route.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <defs>
                <linearGradient id={`gradient-${route.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={route.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={route.color} stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d={`M ${route.startLocation.x * 40} ${window.innerHeight - route.startLocation.y * 40} 
                    ${route.waypoints.map(wp => `L ${wp.x * 40} ${window.innerHeight - wp.y * 40}`).join(' ')} 
                    L ${route.endLocation.x * 40} ${window.innerHeight - route.endLocation.y * 40}`}
                stroke={`url(#gradient-${route.id})`}
                strokeWidth="3"
                fill="none"
                strokeDasharray="10,5"
                className={animationState.isPlaying ? 'animate-pulse' : ''}
              />
              {/* Indicador de dirección */}
              <circle
                cx={route.endLocation.x * 40}
                cy={window.innerHeight - route.endLocation.y * 40}
                r="4"
                fill={route.color}
                className={animationState.isPlaying ? 'animate-ping' : ''}
              />
            </svg>
          ))}

          {/* Almacenes mejorados */}
          {showWarehouses && warehouses.map(warehouse => (
            <div
              key={warehouse.id}
              className="absolute z-30 group cursor-pointer"
              style={{
                left: `${warehouse.location.x * 40}px`,
                bottom: `${warehouse.location.y * 40}px`,
                transform: 'translate(-50%, 50%)',
              }}
              onClick={() => setSelectedElement(warehouse.id)}
            >
              <div className="relative">
                <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center border-3 border-white shadow-xl transition-transform hover:scale-110 ${selectedElement === warehouse.id ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}>
                  <Home size={20} className="text-white" />
                </div>
                {/* Indicador de capacidad */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: warehouse.currentStock / warehouse.capacity > 0.8 ? '#ef4444' : 
                                      warehouse.currentStock / warehouse.capacity > 0.5 ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                </div>
              </div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                <div className="font-semibold">{warehouse.name}</div>
                <div>Stock: {warehouse.currentStock}/{warehouse.capacity}</div>
                <div className="text-xs text-gray-300">
                  Capacidad: {((warehouse.currentStock / warehouse.capacity) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}

          {/* Camiones mejorados */}
          {showTrucks && trucks.map(truck => (
            <div
              key={truck.id}
              className="absolute z-25 group cursor-pointer"
              style={{
                left: `${truck.location.x * 40}px`,
                bottom: `${truck.location.y * 40}px`,
                transform: 'translate(-50%, 50%)',
              }}
              onClick={() => setSelectedElement(truck.id)}
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full ${getStatusColor(truck.status)} border-3 border-white shadow-lg flex items-center justify-center transition-all hover:scale-110 ${selectedElement === truck.id ? 'ring-4 ring-blue-400 ring-opacity-50' : ''} ${animationState.isPlaying && truck.status === 'in_route' ? 'animate-bounce' : ''}`}>
                  <Truck size={14} className="text-white" />
                </div>
                {/* Indicador de carga */}
                {truck.currentLoad > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
                {/* Indicador de avería */}
                {truck.status === 'broken' && (
                  <div className="absolute -top-2 -left-2">
                    <Lightning size={12} className="text-red-500 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                <div className="font-semibold">Camión {truck.id}</div>
                <div>Carga: {truck.currentLoad}/{truck.capacity}kg</div>
                <div>Estado: {truck.status}</div>
                <div>Riesgo: {truck.breakdownRisk}%</div>
                <div className="text-xs text-gray-300">
                  Utilización: {((truck.currentLoad / truck.capacity) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}

          {/* Pedidos mejorados */}
          {showOrders && filteredOrders.map(order => (
            <div
              key={order.id}
              className="absolute z-20 group cursor-pointer"
              style={{
                left: `${order.location.lng * 40}px`,
                bottom: `${order.location.lat * 40}px`,
                transform: 'translate(-50%, 50%)',
              }}
              onClick={() => setSelectedElement(order.id)}
            >
              <div className="relative">
                <div className={`w-5 h-5 rounded-full ${getPriorityColor(order.priority)} border-2 border-white shadow-lg transition-all hover:scale-125 ${selectedElement === order.id ? 'ring-3 ring-blue-400 ring-opacity-50 scale-125' : ''} ${animationState.isPlaying && order.priority === 'urgent' ? 'animate-pulse' : ''}`}>
                </div>
                {/* Indicador de estado */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white">
                  {order.status === 'pending' && <Clock size={8} className="text-gray-600 m-0.5" />}
                  {order.status === 'assigned' && <AlertTriangle size={8} className="text-blue-600 m-0.5" />}
                  {order.status === 'in_transit' && <Truck size={8} className="text-purple-600 m-0.5" />}
                  {order.status === 'delivered' && <CheckCircle size={8} className="text-green-600 m-0.5" />}
                </div>
              </div>
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                <div className="font-semibold">{order.customer}</div>
                <div>Volumen: {order.volume}L</div>
                <div>Estado: {order.status}</div>
                <div>Prioridad: {order.priority}</div>
                <div>Zona: {order.zone}</div>
                <div>ETA: {order.estimatedTime}min</div>
                <div className="text-xs text-gray-300">ID: {order.id}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de información inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/90 backdrop-blur-md border-t border-gray-200 flex items-center justify-between px-6 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-500" />
              <span>Pos: ({Math.round(-mapPosition.x / (40 * zoomLevel))}, {Math.round(-mapPosition.y / (40 * zoomLevel))})</span>
            </div>
            {animationState.isPlaying && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Simulación activa</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500" />
              <span>Eficiencia: {((trucks.reduce((sum, t) => sum + (t.currentLoad / t.capacity), 0) / trucks.length) * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-gray-500">
            Elementos visibles: {(showOrders ? filteredOrders.length : 0) + (showTrucks ? trucks.length : 0) + (showWarehouses ? warehouses.length : 0)}
          </div>
        </div>
      </div>

      {/* Leyenda mejorada */}
      {showLegend && (
        <div className="absolute bottom-16 left-4 z-40 bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold">Leyenda</h4>
            <button
              onClick={() => setShowLegend(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <EyeOff size={14} />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium mb-2">Prioridades</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                  <span>Urgente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
                  <span>Alta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                  <span>Media</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                  <span>Baja</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="font-medium mb-2">Estados</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>Asignado</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck size={12} />
                  <span>En tránsito</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  <span>Entregado</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="font-medium mb-2">Camiones</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>En ruta</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Cargando</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  <span>Averiado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedLogisticsMap;