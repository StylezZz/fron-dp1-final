"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Truck, 
  MapPin, 
  Clock, 
  Fuel, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  ThermometerSun,
  Wind,
  Users,
  Package,
  TrendingUp,
  Activity
} from 'lucide-react'

// Tipos de datos
interface Truck {
  id: string
  type: 'TA' | 'TB' | 'TC' | 'TD'
  position: { x: number; y: number }
  status: 'active' | 'loading' | 'maintenance' | 'standby'
  fuel: number
  capacity: number
  currentLoad: number
  driver: string
  lastUpdate: Date
  efficiency: number
  temperature: number
}

interface GridStats {
  totalDeliveries: number
  activeRoutes: number
  pendingOrders: number
  averageDeliveryTime: number
  fuelConsumption: number
  customerSatisfaction: number
}

// Función para generar datos dinámicos basados en la hora
const generateDynamicData = (currentHour: number): { trucks: Truck[], stats: GridStats } => {
  // Configuración de tipos de camión según especificaciones técnicas
  const truckConfigs = {
    TA: { 
      capacity: 25, // m³ GLP
      weightTare: 2.5, // Ton
      weightGLP: 12.5, // Ton
      weightCombined: 15.0, // Ton
      count: 2, 
      efficiency: 0.92 
    },
    TB: { 
      capacity: 15, // m³ GLP
      weightTare: 2.0, // Ton
      weightGLP: 7.5, // Ton
      weightCombined: 9.5, // Ton
      count: 4, 
      efficiency: 0.88 
    },
    TC: { 
      capacity: 10, // m³ GLP
      weightTare: 1.5, // Ton
      weightGLP: 5.0, // Ton
      weightCombined: 6.5, // Ton
      count: 4, 
      efficiency: 0.85 
    },
    TD: { 
      capacity: 5, // m³ GLP
      weightTare: 1.0, // Ton
      weightGLP: 2.5, // Ton
      weightCombined: 3.5, // Ton
      count: 10, 
      efficiency: 0.82 
    }
  }

  // Operadores sin nombres específicos
  const operators = Array.from({ length: 20 }, (_, i) => `Operador-${String(i + 1).padStart(2, '0')}`)

  // Factor de actividad basado en la hora del día
  const getActivityFactor = (hour: number) => {
    if (hour >= 6 && hour <= 10) return 0.9  // Pico matutino
    if (hour >= 11 && hour <= 15) return 0.7 // Mediodía
    if (hour >= 16 && hour <= 20) return 0.85 // Pico vespertino
    return 0.3 // Madrugada/noche
  }

  const activityFactor = getActivityFactor(currentHour)
  const trucks: Truck[] = []
  let operatorIndex = 0

  Object.entries(truckConfigs).forEach(([type, config]) => {
    for (let i = 0; i < config.count; i++) {
      const baseLoad = Math.random() * config.capacity * activityFactor
      const truck: Truck = {
        id: `${type}-${String(i + 1).padStart(2, '0')}`,
        type: type as 'TA' | 'TB' | 'TC' | 'TD',
        position: {
          x: Math.floor(Math.random() * 70),
          y: Math.floor(Math.random() * 50)
        },
        status: Math.random() > 0.8 ? 'loading' : 
                Math.random() > 0.9 ? 'maintenance' :
                baseLoad > config.capacity * 0.1 ? 'active' : 'standby',
        fuel: 20 + Math.random() * 75,
        capacity: config.capacity,
        currentLoad: Math.floor(baseLoad),
        driver: operators[operatorIndex % operators.length],
        lastUpdate: new Date(Date.now() - Math.random() * 300000),
        efficiency: config.efficiency + (Math.random() - 0.5) * 0.1,
        temperature: 15 + Math.random() * 20
      }
      trucks.push(truck)
      operatorIndex++
    }
  })

  const stats: GridStats = {
    totalDeliveries: Math.floor(120 + Math.random() * 50 * activityFactor),
    activeRoutes: trucks.filter(t => t.status === 'active').length,
    pendingOrders: Math.floor(25 + Math.random() * 40 * (1 - activityFactor)),
    averageDeliveryTime: 28 + Math.random() * 15,
    fuelConsumption: trucks.reduce((acc, truck) => acc + (100 - truck.fuel), 0) / trucks.length,
    customerSatisfaction: 87 + Math.random() * 10
  }

  return { trucks, stats }
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [data, setData] = useState<{ trucks: Truck[], stats: GridStats }>({ trucks: [], stats: {} as GridStats })
  const [selectedTruckType, setSelectedTruckType] = useState<string | null>(null)

  useEffect(() => {
    const updateData = () => {
      const now = new Date()
      setCurrentTime(now)
      setData(generateDynamicData(now.getHours()))
    }

    updateData()
    const interval = setInterval(updateData, 30000) // Actualiza cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'loading': return 'bg-blue-500'
      case 'maintenance': return 'bg-red-500'
      case 'standby': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En Ruta'
      case 'loading': return 'Cargando'
      case 'maintenance': return 'Mantenimiento'
      case 'standby': return 'En Espera'
      default: return 'Desconocido'
    }
  }

  const filteredTrucks = selectedTruckType 
    ? data.trucks.filter(truck => truck.type === selectedTruckType)
    : data.trucks

  const truckTypeStats = ['TA', 'TB', 'TC', 'TD'].map(type => {
    const typeTrucks = data.trucks.filter(t => t.type === type)
    return {
      type,
      count: typeTrucks.length,
      active: typeTrucks.filter(t => t.status === 'active').length,
      efficiency: typeTrucks.reduce((acc, t) => acc + t.efficiency, 0) / typeTrucks.length || 0,
      avgLoad: typeTrucks.reduce((acc, t) => acc + (t.currentLoad / t.capacity), 0) / typeTrucks.length || 0
    }
  })

  const getTimeOfDayStatus = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return { period: 'Mañana', status: 'Alta actividad', color: 'text-green-600' }
    if (hour >= 12 && hour < 18) return { period: 'Tarde', status: 'Actividad moderada', color: 'text-yellow-600' }
    if (hour >= 18 && hour < 22) return { period: 'Noche', status: 'Actividad intensa', color: 'text-orange-600' }
    return { period: 'Madrugada', status: 'Actividad baja', color: 'text-blue-600' }
  }

  const timeStatus = getTimeOfDayStatus()

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50  min-h-screen w-full">
      {/* Header con información temporal */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Centro de Control GLP</h1>
            <p className="text-gray-600">Sistema de Distribución Inteligente</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-mono">
              <Clock className="w-6 h-6" />
              {currentTime.toLocaleTimeString('es-ES')}
            </div>
            <div className={`text-sm ${timeStatus.color} font-semibold`}>
              {timeStatus.period} - {timeStatus.status}
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Rutas Activas</p>
                <p className="text-2xl font-bold">{data.stats.activeRoutes}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Órdenes Pendientes</p>
                <p className="text-2xl font-bold">{data.stats.pendingOrders}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Satisfacción</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Especificaciones Técnicas de la Flota */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 w-full">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Especificaciones Técnicas de la Flota
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 font-semibold">Tipo</th>
                <th className="text-left p-3 font-semibold">Peso Tara</th>
                <th className="text-left p-3 font-semibold">Carga GLP</th>
                <th className="text-left p-3 font-semibold">Peso Carga GLP</th>
                <th className="text-left p-3 font-semibold">Peso Combinado</th>
                <th className="text-left p-3 font-semibold">Unidades</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">TA</Badge>
                    <span className="font-medium">Tipo A</span>
                  </div>
                </td>
                <td className="p-3 font-mono">2.5 Ton</td>
                <td className="p-3 font-mono">25 m³</td>
                <td className="p-3 font-mono">12.5 Ton</td>
                <td className="p-3 font-mono font-bold">15.0 Ton</td>
                <td className="p-3">
                  <Badge variant="secondary">02 unid</Badge>
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50">TB</Badge>
                    <span className="font-medium">Tipo B</span>
                  </div>
                </td>
                <td className="p-3 font-mono">2.0 Ton</td>
                <td className="p-3 font-mono">15 m³</td>
                <td className="p-3 font-mono">7.5 Ton</td>
                <td className="p-3 font-mono font-bold">9.5 Ton</td>
                <td className="p-3">
                  <Badge variant="secondary">04 unid</Badge>
                </td>
                
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50">TC</Badge>
                    <span className="font-medium">Tipo C</span>
                  </div>
                </td>
                <td className="p-3 font-mono">1.5 Ton</td>
                <td className="p-3 font-mono">10 m³</td>
                <td className="p-3 font-mono">5.0 Ton</td>
                <td className="p-3 font-mono font-bold">6.5 Ton</td>
                <td className="p-3">
                  <Badge variant="secondary">04 unid</Badge>
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50">TD</Badge>
                    <span className="font-medium">Tipo D</span>
                  </div>
                </td>
                <td className="p-3 font-mono">1.0 Ton</td>
                <td className="p-3 font-mono">5 m³</td>
                <td className="p-3 font-mono">2.5 Ton</td>
                <td className="p-3 font-mono font-bold">3.5 Ton</td>
                <td className="p-3">
                  <Badge variant="secondary">10 unid</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadísticas por tipo de camión */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 w-full">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Flota por Categoría
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {truckTypeStats.map((stat) => (
            <div 
              key={stat.type}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTruckType === stat.type 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTruckType(selectedTruckType === stat.type ? null : stat.type)}
            >
              <div className="text-center">
                <h3 className="font-bold text-lg">Tipo {stat.type}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-semibold">{stat.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Capacidad:</span>
                    <span className="font-semibold">{stat.type === 'TA' ? '25 m³' : stat.type === 'TB' ? '15 m³' : stat.type === 'TC' ? '10 m³' : '5 m³'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Peso Max:</span>
                    <span className="font-semibold">{stat.type === 'TA' ? '15.0 T' : stat.type === 'TB' ? '9.5 T' : stat.type === 'TC' ? '6.5 T' : '3.5 T'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de camiones */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estado de Flota {selectedTruckType && `- Tipo ${selectedTruckType}`}
          </h2>
          {selectedTruckType && (
            <button 
              onClick={() => setSelectedTruckType(null)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Ver todos los camiones
            </button>
          )}
        </div>
        
        <div className="grid gap-3 max-h-[500px] overflow-y-auto w-full">
          {filteredTrucks.map((truck) => (
            <div key={truck.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(truck.status)}`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{truck.id}</span>
                      <Badge variant="outline">Tipo {truck.type}</Badge>
                      <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                        {getStatusText(truck.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {truck.driver}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Grid ({truck.position.x}, {truck.position.y})
                      </span>
                      <span className="flex items-center gap-1">
                        <ThermometerSun className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{truck.type === 'TA' ? '25m³' : truck.type === 'TB' ? '15m³' : truck.type === 'TC' ? '10m³' : '5m³'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Actualizado: {truck.lastUpdate.toLocaleTimeString('es-ES')}
                  </div>
                </div>
              </div>
              
              {/* Barras de progreso */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">Combustible</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${truck.fuel > 30 ? 'bg-green-500' : truck.fuel > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${truck.fuel}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">Carga</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${(truck.currentLoad / truck.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información del grid */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 w-full">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Información del Grid de Distribución
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Dimensiones del Grid</h3>
            <p className="text-2xl font-bold">70 x 50</p>
            <p className="text-sm text-gray-600">3,500 sectores de distribución</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Capacidad Total de Flota</h3>
            <p className="text-2xl font-bold">240 m³</p>
            <p className="text-sm text-gray-600">GLP distribuible por ciclo</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Peso Total Combinado</h3>
            <p className="text-2xl font-bold">186 Ton</p>
            <p className="text-sm text-gray-600">Capacidad máxima de carga</p>
          </div>
        </div>
      </div>
    </div>
  )
}