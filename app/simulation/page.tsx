"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  PlusCircle, 
  Rocket, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Trash2
} from "lucide-react"
import { SimulationWizard } from "@/components/simulation/SimulationWizard"
import { SimulationType } from "@/components/simulation/types"
import GlpLogisticAPI from "@/data/glpAPI"
import { toast } from "sonner"

interface SimulationItem {
  id: string
  key?: string
  name: string
  type: SimulationType
  status: "running" | "completed" | "paused" | "pending" | "error"
  progress: number
  startTime: string
  estimatedEnd: string
  createdAt: string
}

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState("simulations")
  const [simulations, setSimulations] = useState<SimulationItem[]>([])

  const [ordersFiles,setOrdersFiles] = useState<any[]>([])
  const [blockagesFiles,setBlockagesFiles] = useState<any[]>([])
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesErrors, setFilesErrors] = useState<string[]>([]);

  // Cargar simulaciones del localStorage al iniciar
  useEffect(() => {
    loadSimulationsFromStorage()
    loadAvailableFiles()
  }, [])

  const loadSimulationsFromStorage = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('simulacion-'))
      const loadedSimulations: SimulationItem[] = []
      
      keys.forEach(key => {
        const simulationData = localStorage.getItem(key)
        if (simulationData) {
          const simulation = JSON.parse(simulationData)
          loadedSimulations.push(simulation)
        }
      })
      
      // Si no hay simulaciones guardadas, usar datos de ejemplo
      if (loadedSimulations.length === 0) {
        const defaultSimulations: SimulationItem[] = [
          {
            id: "1",
            key: "simulacion-ejemplo-1",
            name: "Simulación Día a Día - Enero 2025",
            type: SimulationType.DIA_DIA,
            status: "running",
            progress: 45,
            startTime: "09:30",
            estimatedEnd: "12:45",
            createdAt: "2025-01-15"
          },
          {
            id: "2",
            key: "simulacion-ejemplo-2", 
            name: "Simulación Semanal - Diciembre 2024",
            type: SimulationType.SEMANAL,
            status: "completed",
            progress: 100,
            startTime: "08:00",
            estimatedEnd: "Completado",
            createdAt: "2025-01-14"
          },
          {
            id: "3",
            key: "simulacion-ejemplo-3",
            name: "Simulación Colapso - Escenario Crítico",
            type: SimulationType.COLAPSO,
            status: "paused",
            progress: 23,
            startTime: "14:20",
            estimatedEnd: "Pausado",
            createdAt: "2025-01-13"
          }
        ]
        
        // Guardar simulaciones de ejemplo en localStorage
        defaultSimulations.forEach(sim => {
          if (sim.key) {
            localStorage.setItem(sim.key, JSON.stringify(sim))
          }
        })
        
        setSimulations(defaultSimulations)
      } else {
        // Ordenar por fecha de creación (más reciente primero)
        loadedSimulations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setSimulations(loadedSimulations)
      }
    } catch (error) {
      console.error('Error al cargar simulaciones del localStorage:', error)
    }
  }

  const loadAvailableFiles = async () => {
    setFilesLoading(true)
    setFilesErrors([])

    try{
      const ordersResult = await GlpLogisticAPI.files.getOrdersFile();
      if(ordersResult.success){
        setOrdersFiles(ordersResult.files);
      }else{
        console.error('Error al cargar archivos de pedidos: ', ordersResult.mensaje);
      }

      const blockagesResult = await GlpLogisticAPI.files.getBlockagesFile();
      if(blockagesResult.success){
        setBlockagesFiles(blockagesResult.files);
      }else{
        console.error('Error al cargar archivos de bloqueos: ', blockagesResult.mensaje);
      }
    }catch(error){
      console.error('Error al cargar archivos: ', error);
    }finally{
      setFilesLoading(false);
    }
  }

  const saveSimulacion = (simulacionNueva: SimulationItem) => {
    try {
      // Generar key única usando timestamp + random
      const key = `simulacion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      simulacionNueva.key = key
      
      const simulacionString = JSON.stringify(simulacionNueva)
      localStorage.setItem(key, simulacionString)
      
      setSimulations(prev => [simulacionNueva, ...prev])
      return key
    } catch (error) {
      console.error('Error al guardar simulación:', error)
      throw error
    }
  }

  const updateSimulacion = (id: string, updates: Partial<SimulationItem>) => {
    try {
      setSimulations(prev => prev.map(sim => {
        if (sim.id === id) {
          const updatedSim = { ...sim, ...updates }
          // Actualizar en localStorage también
          if (sim.key) {
            localStorage.setItem(sim.key, JSON.stringify(updatedSim))
          }
          return updatedSim
        }
        return sim
      }))
    } catch (error) {
      console.error('Error al actualizar simulación:', error)
    }
  }

  const deleteSimulacion = (id: string) => {
    try {
      const simulation = simulations.find(sim => sim.id === id)
      if (simulation?.key) {
        localStorage.removeItem(simulation.key)
      }
      setSimulations(prev => prev.filter(sim => sim.id !== id))
    } catch (error) {
      console.error('Error al eliminar simulación:', error)
    }
  }

  const clearAllSimulations = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('simulacion-'))
      keys.forEach(key => localStorage.removeItem(key))
      setSimulations([])
    } catch (error) {
      console.error('Error al limpiar simulaciones:', error)
    }
  }

  // Función para subir archivos
  const handleFileUpload = async (file:File, type: 'orders' | 'blockages') => {
    try{
      let result;
      if(type === 'orders'){
        result = await GlpLogisticAPI.upload.orders(file);
      }else{
        result = await GlpLogisticAPI.upload.blockages(file);
      }

      if(result.success){
        toast.success(`Archivo de ${type} subido correctamente: ${result.mensaje}`, {
          duration: 5000,
        });
      }else{
        toast.error(`Error al subir archivo de ${type}: ${result.mensaje}`, {
          duration: 5000,
        });
      }

    } catch (error) {
      toast.error(`Error al subir archivo de ${type}: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        duration: 5000
      });
    }
  }

  const handleSimulationComplete = (data: any) => {
    try {
      const newSimulation: SimulationItem = {
        id: Date.now().toString(),
        name: `Simulación ${getTypeLabel(data.type)} - ${new Date().toLocaleDateString()}`,
        type: data.type,
        status: "pending",
        progress: 0,
        startTime: "Pendiente",
        estimatedEnd: "Pendiente",
        createdAt: new Date().toISOString().split('T')[0]
      }
      
      saveSimulacion(newSimulation)
      setActiveTab("simulations")
    } catch (error) {
      console.error('Error al crear simulación:', error)
    }
  }

  const handleSimulationAction = (id: string, action: "play" | "pause" | "stop" | "restart") => {
    const updates: Partial<SimulationItem> = {}
    
    switch (action) {
      case "play":
        updates.status = "running"
        // Si no tiene hora de inicio o está pendiente, asignar hora actual
        const currentSim = simulations.find(s => s.id === id)
        if (!currentSim?.startTime || currentSim.startTime === "Pendiente") {
          updates.startTime = new Date().toLocaleTimeString()
        }
        break
      case "pause":
        updates.status = "paused"
        break
      case "stop":
        updates.status = "completed"
        updates.progress = 100
        updates.estimatedEnd = "Completado"
        break
      case "restart":
        updates.status = "running"
        updates.progress = 0
        updates.startTime = new Date().toLocaleTimeString()
        updates.estimatedEnd = "Calculando..."
        break
    }
    
    updateSimulacion(id, updates)
  }

  const getTypeLabel = (type: SimulationType) => {
    switch (type) {
      case SimulationType.DIA_DIA:
        return "Día a Día"
      case SimulationType.SEMANAL:
        return "Semanal"
      case SimulationType.COLAPSO:
        return "Colapso"
      default:
        return "Desconocido"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-3 w-3" />
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />
      case "paused":
        return <Pause className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "error":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulations">Simulaciones</TabsTrigger>
            <TabsTrigger value="create">Nueva Simulación</TabsTrigger>
          </TabsList>

          {/* Simulations List Tab */}
          <TabsContent value="simulations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Mis Simulaciones</h2>
              <div className="flex gap-2">
                <Button
                  onClick={clearAllSimulations}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpiar Todo
                </Button>
                <Button
                  onClick={() => setActiveTab("create")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nueva Simulación
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {simulations.map((simulation) => (
                <Card key={simulation.id} className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{simulation.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(simulation.status)}>
                            {getStatusIcon(simulation.status)}
                            <span className="ml-1 capitalize">{simulation.status}</span>
                          </Badge>
                          <Badge variant="secondary">
                            {getTypeLabel(simulation.type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {simulation.status === "paused" || simulation.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSimulationAction(simulation.id, "play")}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        
                        {simulation.status === "running" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSimulationAction(simulation.id, "pause")}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : null}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSimulationAction(simulation.id, "stop")}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSimulationAction(simulation.id, "restart")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSimulacion(simulation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span>{simulation.progress}%</span>
                      </div>
                      <Progress value={simulation.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Inicio: {simulation.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span>Fin est.: {simulation.estimatedEnd}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Creado: {simulation.createdAt}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botón para limpiar todas las simulaciones */}
            <div className="flex justify-end">
              <Button
                onClick={clearAllSimulations}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar Todas las Simulaciones
              </Button>
            </div>
          </TabsContent>

          {/* Create Simulation Tab */}
          <TabsContent value="create" className="space-y-6">
            <SimulationWizard 
              onComplete={handleSimulationComplete}
              isModal={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
