/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import MapTruckAnimated from "@/components/map/MapTruckAnimated";
import TruckDebugPanel from "@/components/map/TruckDebugPanel";
import AnimationSpeedControl from "@/components/map/AnimationControlSpeed";
import GlpLogisticAPI from "@/data/glpAPI";
import { SimulationProvider, useSimulation } from "@/hooks/useSimulation";
import {
  Bell,
  Clock,
  EyeOff,
  Home,
  Layers,
  MapPin,
  Maximize,
  Minimize,
  Minus,
  Network,
  Pause,
  MapPin as Pin,
  Play,
  Plus,
  RotateCcw,
  Search,
  Target,
  Truck,
  Zap,
  Gauge
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MapGrid from "../../components/map/MapGrid";
import MapOrder from "../../components/map/MapOrder";
import MapWarehouse from "../../components/map/MapWarehouse";

// Tipos basados en tu estructura actual
interface MapPosition {
  x: number;
  y: number;
}

interface Order {
  id: string;
  location: { lat: number; lng: number };
  status: "pending" | "assigned" | "in_transit" | "delivered";
  priority: "low" | "medium" | "high" | "urgent";
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
  status: "available" | "in_route" | "loading" | "maintenance" | "broken";
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
  type: "warning" | "error" | "success" | "info";
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

const MapWithSimulation: React.FC = () => {
  // Estados del mapa
  const [mapPosition, setMapPosition] = useState<MapPosition>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTheme, setMapTheme] = useState<"light" | "dark" | "satellite">("light");
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [truckAnimationSpeed, setTruckAnimationSpeed] = useState(0.2);
  const [animationSpeed, setAnimationSpeed] = useState(0.3);
  const [showSpeedControl, setShowSpeedControl] = useState(true);
  // Estados de visualización avanzados
  const [showOrders, setShowOrders] = useState(true);
  const [showTrucks, setShowTrucks] = useState(true);
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Estados de animación y tiempo real
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    speed: 1,
    currentTime: 0,
  });

  // Estados de panel
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const [orderViewMode, setOrderViewMode] = useState<"list" | "timeline" | "zones" | "network">(
    "list"
  );

  // Estados de notificaciones y averías
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Referencias
  const mapRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Datos de ejemplo basados en tu estructura (con mejoras)
  const [warehouses] = useState<Warehouse[]>([
    {
      id: "1",
      name: "Almacén Central",
      location: { x: 12, y: 8 },
      capacity: 1000,
      currentStock: 750,
    },
    {
      id: "2",
      name: "Almacén Norte",
      location: { x: 25, y: 35 },
      capacity: 500,
      currentStock: 300,
    },
    { id: "3", name: "Almacén Sur", location: { x: 8, y: 5 }, capacity: 300, currentStock: 200 },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1",
      location: { lat: 20, lng: 15 },
      status: "pending",
      priority: "high",
      customer: "Cliente A",
      volume: 100,
      zone: "Norte",
      estimatedTime: 45,
    },
    {
      id: "2",
      location: { lat: 30, lng: 25 },
      status: "assigned",
      priority: "urgent",
      customer: "Cliente B",
      volume: 150,
      assignedTruck: "1",
      zone: "Norte",
      estimatedTime: 30,
    },
    {
      id: "3",
      location: { lat: 10, lng: 35 },
      status: "in_transit",
      priority: "medium",
      customer: "Cliente C",
      volume: 75,
      assignedTruck: "2",
      zone: "Sur",
      estimatedTime: 60,
    },
    {
      id: "4",
      location: { lat: 18, lng: 8 },
      status: "delivered",
      priority: "low",
      customer: "Cliente D",
      volume: 200,
      zone: "Centro",
      estimatedTime: 0,
    },
    {
      id: "5",
      location: { lat: 22, lng: 20 },
      status: "pending",
      priority: "urgent",
      customer: "Cliente E",
      volume: 125,
      zone: "Norte",
      estimatedTime: 25,
    },
    {
      id: "6",
      location: { lat: 14, lng: 12 },
      status: "assigned",
      priority: "high",
      customer: "Cliente F",
      volume: 80,
      assignedTruck: "3",
      zone: "Centro",
      estimatedTime: 40,
    },
  ]);

  const [trucks, setTrucks] = useState<Truck[]>([
    {
      id: "1",
      location: { x: 15, y: 12 },
      status: "available",
      capacity: 500,
      currentLoad: 0,
      route: [
        { x: 15, y: 12 },
        { x: 20, y: 15 },
        { x: 25, y: 20 },
      ],
      assignedOrders: [],
      lastMaintenance: "2024-01-15",
      breakdownRisk: 15,
    },
    {
      id: "2",
      location: { x: 22, y: 28 },
      status: "in_route",
      capacity: 500,
      currentLoad: 300,
      route: [
        { x: 22, y: 28 },
        { x: 18, y: 25 },
        { x: 12, y: 20 },
      ],
      assignedOrders: ["3"],
      lastMaintenance: "2024-01-10",
      breakdownRisk: 25,
    },
    {
      id: "3",
      location: { x: 8, y: 6 },
      status: "loading",
      capacity: 300,
      currentLoad: 100,
      route: [
        { x: 8, y: 6 },
        { x: 12, y: 8 },
        { x: 20, y: 15 },
      ],
      assignedOrders: ["6"],
      lastMaintenance: "2024-01-20",
      breakdownRisk: 8,
    },
  ]);

  const routes: Route[] = [
    {
      id: "route1",
      startLocation: { x: 12, y: 8 },
      endLocation: { x: 20, y: 15 },
      waypoints: [
        { x: 15, y: 10 },
        { x: 18, y: 12 },
      ],
      truckId: "1",
      color: "#3b82f6",
    },
    {
      id: "route2",
      startLocation: { x: 25, y: 35 },
      endLocation: { x: 30, y: 25 },
      waypoints: [{ x: 28, y: 30 }],
      truckId: "2",
      color: "#ef4444",
    },
  ];

  // Función para añadir notificaciones
  const addNotification = useCallback((type: Notification["type"], message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 5));

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }, []);

  // Función para averiar camión
  const breakdownTruck = useCallback(
    (truckId: string) => {
      setTrucks((prev) =>
        prev.map((truck) => {
          if (truck.id === truckId) {
            // Reasignar pedidos automáticamente
            const affectedOrders = orders.filter((order) => order.assignedTruck === truckId);
            if (affectedOrders.length > 0) {
              // Buscar camión disponible
              const availableTruck = prev.find(
                (t) =>
                  t.id !== truckId &&
                  t.status === "available" &&
                  t.currentLoad + affectedOrders.reduce((sum, o) => sum + o.volume, 0) <= t.capacity
              );

              if (availableTruck) {
                // Reasignar pedidos
                setOrders((prevOrders) =>
                  prevOrders.map((order) =>
                    affectedOrders.includes(order)
                      ? { ...order, assignedTruck: availableTruck.id, status: "assigned" as const }
                      : order
                  )
                );
                addNotification(
                  "warning",
                  `Camión ${truckId} averiado. Pedidos reasignados a Camión ${availableTruck.id}`
                );
              } else {
                // No hay camiones disponibles
                setOrders((prevOrders) =>
                  prevOrders.map((order) =>
                    affectedOrders.includes(order)
                      ? { ...order, assignedTruck: undefined, status: "pending" as const }
                      : order
                  )
                );
                addNotification(
                  "error",
                  `Camión ${truckId} averiado. No hay camiones disponibles para reasignar ${affectedOrders.length} pedido(s)`
                );
              }
            }

            return {
              ...truck,
              status: "broken" as const,
              currentLoad: 0,
              assignedOrders: [],
            };
          }
          return truck;
        })
      );
    },
    [orders, addNotification]
  );

  // Función para reparar camión
  const repairTruck = useCallback(
    (truckId: string) => {
      setTrucks((prev) =>
        prev.map((truck) =>
          truck.id === truckId
            ? { ...truck, status: "available" as const, breakdownRisk: 5 }
            : truck
        )
      );
      addNotification("success", `Camión ${truckId} reparado y disponible`);
    },
    [addNotification]
  );

  // Calcular zonas de pedidos
  const calculateZones = useCallback((): Zone[] => {
    const zoneMap = new Map<string, Order[]>();

    orders.forEach((order) => {
      const zone = order.zone || "Sin zona";
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, []);
      }
      zoneMap.get(zone)!.push(order);
    });

    return Array.from(zoneMap.entries()).map(([zoneName, zoneOrders]) => {
      const center = zoneOrders.reduce(
        (acc, order) => ({
          x: acc.x + order.location.lng,
          y: acc.y + order.location.lat,
        }),
        { x: 0, y: 0 }
      );

      const avgPriority =
        zoneOrders.reduce((sum, order) => {
          const priorityValue = { low: 1, medium: 2, high: 3, urgent: 4 }[order.priority];
          return sum + priorityValue;
        }, 0) / zoneOrders.length;

      return {
        id: zoneName.toLowerCase().replace(" ", "_"),
        name: zoneName,
        orders: zoneOrders,
        averagePriority: avgPriority,
        center: {
          x: center.x / zoneOrders.length,
          y: center.y / zoneOrders.length,
        },
      };
    });
  }, [orders]);

  // Manejo de zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.3));
  }, []);

  // Manejo de arrastre
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y };
    },
    [mapPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        setMapPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      }
    },
    [isDragging]
  );

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

  // Obtener color basado en prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Obtener color basado en estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-400";
      case "assigned":
        return "bg-blue-500";
      case "in_transit":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-600";
      case "available":
        return "bg-green-500";
      case "loading":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-orange-500";
      case "broken":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesPriority = filterPriority === "all" || order.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      !searchQuery || order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  // Obtener tema del mapa
  const getMapTheme = () => {
    switch (mapTheme) {
      case "dark":
        return {
          background: "bg-gray-900",
          gridColor: "#374151",
          mainGridColor: "#4b5563",
          textColor: "text-white",
        };
      case "satellite":
        return {
          background: "bg-green-900",
          gridColor: "#065f46",
          mainGridColor: "#047857",
          textColor: "text-green-100",
        };
      default:
        return {
          background: "bg-white",
          gridColor: "#e2e8f0",
          mainGridColor: "#cbd5e1",
          textColor: "text-gray-900",
        };
    }
  };

  const theme = getMapTheme();
  const zones = calculateZones();

  // Estado para simulaciones
  const [simulaciones, setSimulaciones] = useState<any[]>([]);
  const [simulacionActiva, setSimulacionActiva] = useState<any | null>(null);
  const [loadingSimData, setLoadingSimData] = useState(false);
  const [simOrders, setSimOrders] = useState<any[]>([]);
  const [simBlockages, setSimBlockages] = useState<any[]>([]);
  const [simError, setSimError] = useState<string | null>(null);
  const [simTrucks, setSimTrucks] = useState<any[]>([]);

  // Contexto de simulación
  const {
    simulationType,
    setSimulationType,
    currentTime,
    setCurrentTime,
    status,
    setStatus,
    duration,
    resetSimulation,
  } = useSimulation();

  // Estado para saber si los datos están listos
  const [datosListos, setDatosListos] = useState(false);

  // Cargar simulaciones del localStorage al montar
  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("simulacion-"));
    const loadedSimulations: any[] = [];
    keys.forEach((key) => {
      const simulationData = localStorage.getItem(key);
      if (simulationData) {
        loadedSimulations.push(JSON.parse(simulationData));
      }
    });
    loadedSimulations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setSimulaciones(loadedSimulations);
  }, []);

  const [timerOffset, setTimerOffset] = useState(0);
  
  const calcularTimerACO = useCallback((currentTime: number) => {
    // Timer ACO siempre empieza en 1440 y avanza linealmente
    const timerACO = 1440 + currentTime + timerOffset;
    
    // Log para debugging (comentar en producción)
    if (currentTime % 60 === 0) { // Solo cada hora para no spamear
      const diaSimulado = Math.floor(currentTime / 1440) + 1;
      const horaSimulada = Math.floor((currentTime % 1440) / 60);
      const minutoSimulado = currentTime % 60;
      console.log(`🕐 Timer: currentTime=${currentTime}, timerACO=${timerACO}, tiempo=${diaSimulado}d ${horaSimulada}h ${minutoSimulado}m`);
    }
    
    return timerACO;
  }, [timerOffset]);

  // Función unificada de control
  const toggleSimulation = useCallback(() => {
    const newStatus = status === "running" ? "paused" : "running";

    // 🔄 Actualizar ambos sistemas simultáneamente
    setStatus(newStatus);
    setAnimationState((prev) => ({
      ...prev,
      isPlaying: newStatus === "running",
    }));
  }, [status, setStatus]);

  // Timer automático para currentTime si cambia el status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "running" && datosListos) {
      // ⚡ Timer que avanza cada segundo
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 10; // Avanza 1 minuto de simulación

          // 🔚 Verificar si llegó al final de la simulación (7 días = 10080 minutos)
          if (newTime >= duration) {
            setStatus("finished");
            return duration;
          }

          return newTime;
        });
      }, 1000); // Cada 1 segundo real = 1 minuto de simulación
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, datosListos, duration, setCurrentTime, setStatus]);

  // Cuando se selecciona una simulación, cargar pedidos y bloqueos
  useEffect(() => {
    const fetchSimData = async () => {
      if (!simulacionActiva) return;
      setLoadingSimData(true);
      setSimError(null);
      setDatosListos(false);
      try {
        // Usar los campos explícitos si existen
        let anio = simulacionActiva.anioBase;
        let mes = simulacionActiva.mesBase;
        let diaReal = simulacionActiva.diaBase;
        // Si no existen, intentar usar fechaBase o createdAt
        if (!anio || !mes || !diaReal) {
          const fechaStr = simulacionActiva.fechaBase || simulacionActiva.createdAt;
          if (fechaStr) {
            const fecha = fechaStr.split("-");
            anio = parseInt(fecha[0], 10);
            mes = parseInt(fecha[1], 10);
            diaReal = parseInt(fecha[2], 10);
          } else {
            anio = 2025;
            mes = 1;
            diaReal = 1;
          }
        }
        const hora = 0;
        const minuto = 0;
        const ordersResult = await GlpLogisticAPI.simulation.weeklyOrders({
          anio,
          mes,
          dia: diaReal,
          hora,
          minuto,
        });
        setSimOrders(ordersResult?.pedidos || []);
        const blockagesResult = await GlpLogisticAPI.simulation.weeklyBlockages({
          anio,
          mes,
          dia: diaReal,
          hora,
          minuto,
        });
        setSimBlockages(blockagesResult?.bloqueos || []);
        setDatosListos(true);
      } catch (err) {
        setSimError("Error al cargar datos de la simulación");
        console.error(err);
      } finally {
        setLoadingSimData(false);
      }
    };
    if (simulacionActiva) fetchSimData();
  }, [simulacionActiva]);

  // useEffect para consutlar iterativamente las rutas
  useEffect(() => {
    const iterarAlgoritmo = async () => {
      if (!simulacionActiva || status !== "running" || !datosListos) return;

      // 🕐 Solo ejecutar cada 60 minutos de simulación (configurable)
      if (currentTime % 5 !== 0) return;

      try {
        const timerACO = calcularTimerACO(currentTime);

        console.log(
          `🔄 Iterando ACO - Tiempo: ${Math.floor(currentTime / 1440)}d ${Math.floor(
            (currentTime % 1440) / 60
          )}h ${currentTime % 60}m`
        );

        // 🔥 Llamar a weeklyRoutes que itera el algoritmo
        const response = await GlpLogisticAPI.simulation.weeklyRoutes({
          anio: simulacionActiva.anioBase || 2025,
          mes: simulacionActiva.mesBase || 1,
          timer: timerACO,
          minutosPorIteracion: 1,
        });

        console.log("🚚 Camiones actualizados:", response?.data?.camiones || []);

        if (response?.data) {
          setSimTrucks(
            Array.isArray(response.data) ? response.data : response.data?.camiones || []
          );
        }
      } catch (err) {
        console.error("Error en iteración ACO:", err);
      }
    };

    iterarAlgoritmo();
  }, [currentTime, simulacionActiva, status, datosListos, calcularTimerACO]);

  // Función para obtener color según tipo de camión
  const getTruckColor = (codigo: string) => {
    if (codigo.startsWith("TA")) return "bg-blue-500";
    if (codigo.startsWith("TB")) return "bg-green-500";
    if (codigo.startsWith("TC")) return "bg-yellow-500";
    if (codigo.startsWith("TD")) return "bg-red-500";
    return "bg-gray-400";
  };

  const getTruckStats = useCallback(() => {
    if (!Array.isArray(simTrucks)) return { total: 0, enRuta: 0, averiados: 0, cargados: 0 };
    
    const stats = {
      total: simTrucks.length,
      enRuta: simTrucks.filter(t => t.route && t.route.length > 0).length,
      averiados: simTrucks.filter(t => t.enAveria).length,
      cargados: simTrucks.filter(t => (t.cargaAsignada || 0) > 0).length
    };
    return stats;
  }, [simTrucks]);

  const debugTruckData = useCallback(() => {
    if (simTrucks.length > 0) {
      const timerACO = calcularTimerACO(currentTime);
      console.log("🔍 Debug - Estado actual:", {
        currentTime,
        timerACO,
        trucksCount: simTrucks.length,
        sampleTruck: simTrucks[0] ? {
          codigo: simTrucks[0].codigo,
          routeLength: simTrucks[0].route?.length || 0,
          firstRouteNode: simTrucks[0].route?.[0],
          ubicacionActual: simTrucks[0].ubicacionActual
        } : null
      });
    }
  }, [simTrucks, currentTime, calcularTimerACO, simulacionActiva]);

  useEffect(() => {
    if (status === "running" && simTrucks.length > 0) {
      debugTruckData();
    }
  }, [debugTruckData, status, simTrucks.length]);

  const handleSeleccionarSimulacion = async (sim: any) => {
    resetSimulation();
    setDatosListos(false);
    setStatus("paused");
    setSimulationType("semanal");
    try {
      await GlpLogisticAPI.simulation.weeklyStart({
        tipoSimulacion: 2,
      });
      setSimulacionActiva(sim);
      setDatosListos(true);
    } catch (err) {
      console.error("Error al inicializar:", err);
      setSimError("Error al inicializar la simulación");
    }
  };

  // ✅ AGREGAR estas funciones para gestión de averías
  const registrarAveria = useCallback(
    async (codigoCamion: string, tipoAveria: number) => {
      if (!simulacionActiva || status !== "running") return;

      try {
        const timerACO = calcularTimerACO(currentTime);

        const averia = {
          id: Date.now(),
          turnoAveria: Math.floor((currentTime % 1440) / 480) + 1, // 1, 2, o 3 turnos
          codigoCamion,
          tipoAveria: ["LEVE", "MODERADO", "GRAVE"][tipoAveria - 1],
          descripcion: `Avería en tiempo ${Math.floor(currentTime / 1440)}d ${Math.floor(
            (currentTime % 1440) / 60
          )}h`,
        };

        // 🔥 Forzar actualización inmediata con avería
        const response = await GlpLogisticAPI.simulation.weeklyRoutes({
          anio: simulacionActiva.anioBase || 2025,
          mes: simulacionActiva.mesBase || 1,
          timer: timerACO,
          minutosPorIteracion: 60,
        });

        if (response.success) {
          setSimTrucks(
            Array.isArray(response.data) ? response.data : response.data?.camiones || []
          );
          addNotification(
            "warning",
            `⚠️ Avería ${averia.tipoAveria} registrada en ${codigoCamion}`
          );
        }
      } catch (err) {
        console.error("Error al registrar avería:", err);
        addNotification("error", "Error al registrar la avería");
      }
    },
    [currentTime, simulacionActiva, status, addNotification, calcularTimerACO]
  );

  // Función para simular avería manual (para testing)
  const simularAveria = useCallback(
    (codigoCamion: string) => {
      const tipoAveria = Math.floor(Math.random() * 3) + 1; // 1, 2, o 3
      registrarAveria(codigoCamion, tipoAveria);
    },
    [registrarAveria]
  );

  const debugTruckPosition = (trucks : any) => {
    const timerACO = calcularTimerACO(currentTime);
    console.log(`🚚 ${trucks.codigo}:`, {
      timerACO,
      currentTime,
      routeLength: trucks.route?.length || 0,
      ubicacionActual: trucks.ubicacionActual,
      route: trucks.route?.slice(0,3) || [],
    });
  }

  // Filtrar pedidos y bloqueos activos según el tiempo de simulación
  const pedidosVisibles = simOrders.filter((p) => p.horaDeInicio <= currentTime && !p.entregado);
  const bloqueosVisibles = simBlockages.filter((b) => {
    const inicio = new Date(b.fechaInicio).getTime() / 60000;
    const fin = new Date(b.fechaFin).getTime() / 60000;
    return inicio <= currentTime && currentTime < fin;
  });

  // Si no hay simulación activa, mostrar selector
  if (!simulacionActiva) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold mb-6">
          Selecciona una simulación para visualizar en el mapa
        </h2>
        <div className="w-full max-w-xl space-y-4">
          {/* Selector de simulaciones a ejecutar */}
          {simulaciones.length === 0 ? (
            <div className="text-gray-500 text-center">
              No hay simulaciones guardadas. Crea una desde la sección de simulaciones.
            </div>
          ) : (
            simulaciones.map((sim) => (
              <button
                key={sim.id}
                className="w-full p-4 bg-white rounded-lg shadow hover:bg-blue-50 border border-gray-200 flex items-center justify-between transition-all"
                onClick={() => handleSeleccionarSimulacion(sim)}
              >
                <div>
                  <div className="font-semibold text-lg">{sim.name}</div>
                  <div className="text-sm text-gray-500">
                    {sim.type} • {sim.createdAt}
                  </div>
                </div>
                <span className="text-blue-600 font-bold">Ver</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Si está cargando datos de la simulación
  if (loadingSimData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-blue-600 font-semibold">
          Cargando datos de la simulación...
        </div>
      </div>
    );
  }
  if (simError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600 font-semibold">{simError}</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-screen relative ${theme.background} overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
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
              className={`p-2 hover:bg-gray-100 rounded-lg relative ${
                notifications.length > 0 ? "text-red-600" : ""
              }`}
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
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-3">
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === "error"
                                ? "bg-red-500"
                                : notification.type === "warning"
                                ? "bg-yellow-500"
                                : notification.type === "success"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                          ></div>
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

          {/* Selector de tema */}
          <select
            value={mapTheme}
            onChange={(e) => setMapTheme(e.target.value as "light" | "dark" | "satellite")}
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

      {/* Contenedor principal del mapa */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-grab mt-16"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <MapGrid theme={theme} zoomLevel={zoomLevel} mapPosition={mapPosition}>
          {/* Almacenes */}
          {showWarehouses &&
            warehouses.map((warehouse) => (
              <MapWarehouse
                key={warehouse.id}
                id={warehouse.id}
                name={warehouse.name}
                x={warehouse.location.x}
                y={warehouse.location.y}
                capacity={warehouse.capacity}
                currentStock={warehouse.currentStock}
                selected={selectedElement === warehouse.id}
                onClick={setSelectedElement}
              />
            ))}
          {/* ✅ Camiones simulados ACO corregidos */}
          {showTrucks &&
            Array.isArray(simTrucks) &&
            simTrucks.map((truck) => {
              if (!truck.codigo && !truck.id) {
                console.warn("Camión sin código o ID:", truck);
                return null;
              }

              const timerACO = calcularTimerACO(currentTime);
              
              // Verificar si tenemos datos válidos
              if (!truck.route || truck.route.length === 0) {
                // Solo mostrar si tiene ubicación actual
                if (truck.ubicacionActual) {
                  return (
                    <MapTruckAnimated
                      key={truck.codigo || truck.id}
                      id={truck.id?.toString() || truck.codigo}
                      codigo={truck.codigo}
                      route={[truck.ubicacionActual]}
                      currentTime={timerACO}
                      ubicacionActual={truck.ubicacionActual}
                      status={truck.enAveria ? 'broken' : 'available'}
                      capacity={truck.carga || 10}
                      currentLoad={truck.cargaAsignada || 0}
                      glpDisponible={truck.glpDisponible || 0}
                      enAveria={truck.enAveria || false}
                      selected={selectedElement === (truck.codigo || truck.id?.toString())}
                      onClick={setSelectedElement}
                      zoomLevel={zoomLevel}
                      mapPosition={mapPosition}
                      animationSpeed={truckAnimationSpeed} // 🎯 Pasar velocidad de animación
                    />
                  );
                }
                return null;
              }

              return (
                <MapTruckAnimated
                  key={truck.codigo || truck.id}
                  id={truck.id?.toString() || truck.codigo}
                  codigo={truck.codigo}
                  route={truck.route}
                  currentTime={timerACO}
                  ubicacionActual={truck.ubicacionActual}
                  status={truck.enAveria ? 'broken' : 'in_route'}
                  capacity={truck.carga || 10}
                  currentLoad={truck.cargaAsignada || 0}
                  glpDisponible={truck.glpDisponible || 0}
                  enAveria={truck.enAveria || false}
                  selected={selectedElement === (truck.codigo || truck.id?.toString())}
                  onClick={setSelectedElement}
                  zoomLevel={zoomLevel}
                  mapPosition={mapPosition}
                  animationSpeed={truckAnimationSpeed} // 🎯 Pasar velocidad de animación
                />
              );
            })}
          {/* Pedidos */}
          {showOrders &&
            pedidosVisibles.map((order) => (
              <MapOrder
                key={order.id}
                id={order.id}
                lat={order.location.lat}
                lng={order.location.lng}
                priority={order.priority}
                status={order.status}
                customer={order.customer}
                volume={order.volume}
                zone={order.zone}
                estimatedTime={order.estimatedTime}
                selected={selectedElement === order.id}
                isAnimating={animationState.isPlaying}
                onClick={setSelectedElement}
              />
            ))}
        </MapGrid>

        {/* Barra de información inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/90 backdrop-blur-md border-t border-gray-200 flex items-center justify-between px-6 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-500" />
              <span>
                Pos: ({Math.round(-mapPosition.x / (40 * zoomLevel))},{" "}
                {Math.round(-mapPosition.y / (40 * zoomLevel))})
              </span>
            </div>
            {status === "running" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Simulación activa</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              <span>ACO: {calcularTimerACO(currentTime).toFixed(0)}</span>
            </div>
          </div>
          <div className="text-gray-500">
            {(() => {
              const stats = getTruckStats();
              return `Camiones: ${stats.total} • En ruta: ${stats.enRuta} • Averiados: ${stats.averiados} • Pedidos: ${pedidosVisibles.length}`;
            })()}
          </div>
        </div>
      </div>

      {/* Leyenda mejorada */}
      {showLegend && (
        <div className="absolute bottom-16 left-4 z-40 bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold">Leyenda</h4>
            <button onClick={() => setShowLegend(false)} className="p-1 hover:bg-gray-100 rounded">
              <EyeOff size={14} />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium mb-2">Camiones</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>TA</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>TB</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>TC</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>TD</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="font-medium mb-2">Almacenes</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <Home size={12} className="text-purple-600" />
                  <span>Central (12,8)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Home size={12} className="text-blue-600" />
                  <span>Norte (42,42)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Home size={12} className="text-green-600" />
                  <span>Este (63,3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CONTROLES DE SIMULACIÓN UNIFICADOS */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 bg-white/90 rounded-xl shadow-lg px-6 py-3">
        {/* ✅ UN SOLO BOTÓN unificado */}
        <button
          onClick={toggleSimulation}
          className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${
            status === "running" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
          disabled={!datosListos}
        >
          {status === "running" ? (
            <>
              <Pause size={20} />
              Pausar
            </>
          ) : (
            <>
              <Play size={20} />
              {status === "paused" ? "Reanudar" : "Iniciar"}
            </>
          )}
        </button>

        {/* ✅ Información de tiempo mejorada */}
        <div className="text-lg font-semibold">
          <span className="text-blue-600">Día {Math.floor(currentTime / 1440) + 1}</span>
          {" • "}
          <span className="text-green-600">
            {String(Math.floor((currentTime % 1440) / 60)).padStart(2, "0")}:
            {String(currentTime % 60).padStart(2, "0")}
          </span>
        </div>

        {/* ✅ Progreso visual */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Progreso:</span>
          <div className="w-64 bg-gray-200 rounded-full h-3 relative">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentTime / duration) * 100, 100)}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
              {((currentTime / duration) * 100).toFixed(1)}%
            </div>
          </div>
          <span className="text-sm text-gray-600">{Math.floor(duration / 1440)} días</span>
        </div>

        {/* ✅ Botón de reset */}
        <button
          onClick={() => {
            setCurrentTime(0);
            setStatus("paused");
            setAnimationState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
          }}
          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
          title="Reiniciar simulación"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <TruckDebugPanel
        trucks={simTrucks || []}
        currentTime={currentTime}
        timerACO={calcularTimerACO(currentTime)}
        isVisible={showDebugPanel}
        onToggle={() => setShowDebugPanel(!showDebugPanel)}
      />
    </div>
  );
};

// Exportar el mapa envuelto en el provider
const ImprovedLogisticsMap: React.FC = () => (
  <SimulationProvider>
    <MapWithSimulation />
  </SimulationProvider>
);

export default ImprovedLogisticsMap;
