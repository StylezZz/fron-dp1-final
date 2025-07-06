"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play,
  Pause,
  Square,
  BarChart3,
  Clock,
  Truck,
  Package,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreVertical
} from "lucide-react"
import { SimulationSummary } from "./types"

interface SimulationCardProps {
  simulation: SimulationSummary
  onView: (id: string) => void
  onPause: (id: string) => void
  onStop: (id: string) => void
  onViewMetrics: (id: string) => void
}

export function SimulationCard({ 
  simulation, 
  onView, 
  onPause, 
  onStop, 
  onViewMetrics 
}: SimulationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "running":
        return {
          color: "bg-blue-500",
          textColor: "text-blue-700",
          bgColor: "bg-blue-50",
          label: "En Ejecución",
          icon: <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        }
      case "completed":
        return {
          color: "bg-green-500",
          textColor: "text-green-700", 
          bgColor: "bg-green-50",
          label: "Completada",
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
        }
      case "pending":
        return {
          color: "bg-yellow-500",
          textColor: "text-yellow-700",
          bgColor: "bg-yellow-50", 
          label: "Pendiente",
          icon: <Clock className="h-4 w-4 text-yellow-500" />
        }
      case "error":
        return {
          color: "bg-red-500",
          textColor: "text-red-700",
          bgColor: "bg-red-50",
          label: "Error", 
          icon: <AlertCircle className="h-4 w-4 text-red-500" />
        }
      default:
        return {
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
          label: "Desconocido",
          icon: <div className="w-2 h-2 bg-gray-500 rounded-full" />
        }
    }
  }

  const statusConfig = getStatusConfig(simulation.status)

  return (
    <Card className={`group transition-all duration-300 hover:shadow-xl border-l-4 ${
      simulation.status === 'running' ? 'border-l-blue-500' :
      simulation.status === 'completed' ? 'border-l-green-500' :
      simulation.status === 'pending' ? 'border-l-yellow-500' :
      'border-l-red-500'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              {statusConfig.icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {simulation.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {simulation.type}
                </Badge>
                <span className="text-xs text-gray-500">
                  {simulation.createdAt}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${statusConfig.color} text-white`}>
              {statusConfig.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar para simulaciones en ejecución */}
        {simulation.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-medium text-blue-600">{simulation.progress}%</span>
            </div>
            <Progress value={simulation.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Iniciado: {simulation.startTime}</span>
              <span>Estimado: {simulation.estimatedEnd}</span>
            </div>
          </div>
        )}

        {/* Métricas básicas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Truck className="h-5 w-5 text-gray-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{simulation.vehicles}</div>
            <div className="text-xs text-gray-500">Vehículos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-5 w-5 text-gray-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{simulation.routes}</div>
            <div className="text-xs text-gray-500">Rutas</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Package className="h-5 w-5 text-gray-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{simulation.orders}</div>
            <div className="text-xs text-gray-500">Pedidos</div>
          </div>
        </div>

        {/* Acciones expandidas */}
        {isExpanded && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onView(simulation.id)}
                className="flex items-center space-x-1"
              >
                <Play className="h-3 w-3" />
                <span>Ver Detalles</span>
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewMetrics(simulation.id)}
                className="flex items-center space-x-1"
              >
                <BarChart3 className="h-3 w-3" />
                <span>Métricas</span>
              </Button>

              {simulation.status === 'running' && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onPause(simulation.id)}
                    className="flex items-center space-x-1"
                  >
                    <Pause className="h-3 w-3" />
                    <span>Pausar</span>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onStop(simulation.id)}
                    className="flex items-center space-x-1"
                  >
                    <Square className="h-3 w-3" />
                    <span>Detener</span>
                  </Button>
                </>
              )}
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 space-y-1">
              <div>ID: {simulation.id}</div>
              <div>Inicio programado: {simulation.startTime}</div>
              {simulation.status === 'running' && (
                <div>Finalización estimada: {simulation.estimatedEnd}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
