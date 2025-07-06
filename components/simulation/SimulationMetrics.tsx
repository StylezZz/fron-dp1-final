"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  Clock, 
  Target, 
  DollarSign,
  Activity,
  Truck
} from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: string
  suffix?: string
}

function MetricCard({ title, value, change, icon, color, suffix = "" }: MetricCardProps) {
  const isPositive = change >= 0
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold text-gray-900">
                {value}{suffix}
              </p>
              <span 
                className={`text-xs font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
        
        <div className="mt-4">
          <div 
            className={`h-1 rounded-full ${color.replace('bg-', 'bg-').replace('-100', '-200')}`} 
            style={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface SimulationMetricsProps {
  simulationId: string
}

export function SimulationMetrics({ simulationId }: SimulationMetricsProps) {
  // Mock data - esto vendría de una API real
  const metrics = {
    efficiency: { value: 94.2, change: 5.2 },
    completionRate: { value: 98.7, change: 2.1 },
    averageDeliveryTime: { value: 2.4, change: -8.3 },
    resourceUtilization: { value: 87.5, change: 3.7 },
    costOptimization: { value: 92.1, change: 4.8 },
    activeVehicles: { value: 24, change: 12.5 }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Métricas de Rendimiento</h2>
        <p className="text-gray-600">Análisis en tiempo real de la simulación {simulationId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Eficiencia Operativa"
          value={metrics.efficiency.value}
          change={metrics.efficiency.change}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          color="bg-blue-100"
          suffix="%"
        />
        
        <MetricCard
          title="Tasa de Completación"
          value={metrics.completionRate.value}
          change={metrics.completionRate.change}
          icon={<Target className="h-6 w-6 text-green-600" />}
          color="bg-green-100"
          suffix="%"
        />
        
        <MetricCard
          title="Tiempo Promedio de Entrega"
          value={metrics.averageDeliveryTime.value}
          change={metrics.averageDeliveryTime.change}
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          color="bg-orange-100"
          suffix="h"
        />
        
        <MetricCard
          title="Utilización de Recursos"
          value={metrics.resourceUtilization.value}
          change={metrics.resourceUtilization.change}
          icon={<Activity className="h-6 w-6 text-purple-600" />}
          color="bg-purple-100"
          suffix="%"
        />
        
        <MetricCard
          title="Optimización de Costos"
          value={metrics.costOptimization.value}
          change={metrics.costOptimization.change}
          icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
          color="bg-emerald-100"
          suffix="%"
        />
        
        <MetricCard
          title="Vehículos Activos"
          value={metrics.activeVehicles.value}
          change={metrics.activeVehicles.change}
          icon={<Truck className="h-6 w-6 text-indigo-600" />}
          color="bg-indigo-100"
        />
      </div>

      {/* Gráfico de rendimiento temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento Temporal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <p>Gráfico de métricas temporales</p>
              <p className="text-sm">(Integración con biblioteca de gráficos pendiente)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
