"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { 
  Calendar, 
  CalendarDays, 
  Zap, 
  Upload, 
  Database, 
  FileText,
  CheckCircle,
  Cog,
  Clock
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SimulationType, mockPedidosFiles, mockBloqueosFiles } from "./types"

interface SimulationWizardProps {
  onClose?: () => void
  onComplete: (data: SimulationData) => void
  isModal?: boolean
}

interface SimulationData {
  type: SimulationType
  date: Date | undefined
  time: { hour: string; minute: string }
  dataSource: "new" | "existing"
  files: {
    pedidos: string
    bloqueos: string
  }
}

export function SimulationWizard({ onClose, onComplete, isModal = true }: SimulationWizardProps) {
  const [formData, setFormData] = useState<Partial<SimulationData>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{pedidos?: File, bloqueos?: File}>({})
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle")
  const [validationProgress, setValidationProgress] = useState(0)

  const simulationTypes = [
    {
      type: SimulationType.DIA_DIA,
      title: "Día a Día",
      subtitle: "Simulación diaria",
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      type: SimulationType.SEMANAL,
      title: "Semanal",
      subtitle: "Simulación semanal",
      icon: CalendarDays,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      type: SimulationType.COLAPSO,
      title: "Colapso",
      subtitle: "Escenario crítico",
      icon: Zap,
      gradient: "from-red-500 to-orange-500"
    }
  ]

  const handleFileUpload = async (type: "pedidos" | "bloqueos", file: File) => {
    if (type === "pedidos" && (!file.name.toLowerCase().includes("ventas") || !file.name.endsWith(".txt"))) {
      alert("Archivo de pedidos debe contener 'ventas' en el nombre y ser .txt")
      return
    }
    if (type === "bloqueos" && (!file.name.toLowerCase().includes("bloqueos") || !file.name.endsWith(".txt"))) {
      alert("Archivo de bloqueos debe contener 'bloqueos' en el nombre y ser .txt")
      return
    }

    setUploadedFiles(prev => ({ ...prev, [type]: file }))
    
    if (uploadedFiles.pedidos && uploadedFiles.bloqueos) {
      await validateFiles()
    }
  }

  const validateFiles = async () => {
    setValidationStatus("validating")
    setValidationProgress(0)

    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 400))
      setValidationProgress((i / 5) * 100)
    }

    setValidationStatus("valid")
    setFormData(prev => ({
      ...prev,
      files: {
        pedidos: uploadedFiles.pedidos?.name || "",
        bloqueos: uploadedFiles.bloqueos?.name || ""
      }
    }))
  }

  const handleComplete = async () => {
    if (!formData.type || !formData.date || !formData.time?.hour || !formData.time?.minute) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setIsProcessing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const simulationData: SimulationData = {
        type: formData.type,
        date: formData.date,
        time: formData.time,
        dataSource: formData.dataSource || "existing",
        files: formData.files || {
          pedidos: mockPedidosFiles[0],
          bloqueos: mockBloqueosFiles[0]
        }
      }

      onComplete(simulationData)
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error creating simulation:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const FormContent = () => (
    <div className="space-y-8 p-6">
      {/* Título */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Nueva Simulación</h2>
        <p className="text-gray-600">Configura los parámetros para tu simulación</p>
      </div>

      {/* Tipo de Simulación */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Tipo de Simulación</Label>
        <div className="grid gap-4 md:grid-cols-3">
          {simulationTypes.map((sim) => {
            const isSelected = formData.type === sim.type
            return (
              <Card 
                key={sim.type}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                  isSelected 
                    ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                    : "hover:border-gray-300"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: sim.type }))}
              >
                <CardContent className="p-4 space-y-3">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center bg-gradient-to-r",
                    sim.gradient
                  )}>
                    <sim.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">{sim.title}</h3>
                    <p className="text-sm text-gray-500">{sim.subtitle}</p>
                  </div>
                  {isSelected && (
                    <Badge className="w-full justify-center bg-blue-500">
                      Seleccionado
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Programación */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fecha */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fecha de simulación
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-12",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.date ? (
                  format(formData.date, "PPPP", { locale: es })
                ) : (
                  <span>Selecciona una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.date}
                onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                disabled={(date) => {
                  const year = date.getFullYear()
                  return year < 2025 || date < new Date("2025-01-01")
                }}
                initialFocus
                locale={es}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Hora */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hora de inicio
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Select 
              value={formData.time?.hour || ""} 
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                time: { hour: value, minute: prev.time?.minute || "" }
              }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={formData.time?.minute || ""} 
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                time: { hour: prev.time?.hour || "", minute: value }
              }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }, (_, i) => (
                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Fuente de Datos */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Fuente de Datos
        </Label>
        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200",
              formData.dataSource === "new" 
                ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                : "hover:border-gray-300"
            )}
            onClick={() => setFormData(prev => ({ ...prev, dataSource: "new" }))}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Subir Archivos</h3>
                  <p className="text-sm text-gray-500">Usar archivos personalizados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200",
              formData.dataSource === "existing" 
                ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                : "hover:border-gray-300"
            )}
            onClick={() => setFormData(prev => ({ ...prev, dataSource: "existing" }))}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Datos Existentes</h3>
                  <p className="text-sm text-gray-500">Usar archivos del sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload de archivos si se selecciona "new" */}
        {formData.dataSource === "new" && (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Archivo de Pedidos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload("pedidos", file)
                  }}
                  className="hidden"
                  id="pedidos-upload"
                />
                <label htmlFor="pedidos-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadedFiles.pedidos ? uploadedFiles.pedidos.name : "Subir archivo de ventas (.txt)"}
                  </p>
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Archivo de Bloqueos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload("bloqueos", file)
                  }}
                  className="hidden"
                  id="bloqueos-upload"
                />
                <label htmlFor="bloqueos-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadedFiles.bloqueos ? uploadedFiles.bloqueos.name : "Subir archivo de bloqueos (.txt)"}
                  </p>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Validación de archivos */}
        {validationStatus === "validating" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cog className="h-4 w-4 animate-spin" />
              <span className="text-sm">Validando archivos...</span>
            </div>
            <Progress value={validationProgress} className="h-2" />
          </div>
        )}

        {validationStatus === "valid" && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Archivos validados correctamente</span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {isModal && onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button 
          onClick={handleComplete} 
          disabled={isProcessing || !formData.type || !formData.date || !formData.time?.hour || !formData.time?.minute}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? 'Creando...' : 'Crear Simulación'}
        </Button>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <FormContent />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <FormContent />
      </div>
    </div>
  )
}