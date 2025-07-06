export enum SimulationType {
  DIA_DIA = "DIA_DIA",
  SEMANAL = "SEMANAL", 
  COLAPSO = "COLAPSO"
}

export interface Month {
  value: string
  label: string
}

export const months: Month[] = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export const mockPedidosFiles: string[] = [
  "ventas202501.txt",
  "ventas202412.txt", 
  "ventas202411.txt",
  "ventas202410.txt"
]

export const mockBloqueosFiles: string[] = [
  "bloqueos202501.txt",
  "bloqueos202412.txt",
  "bloqueos202411.txt", 
  "bloqueos202410.txt"
]

export interface SimulationSummary {
  id: string
  name: string
  type: SimulationType
  status: "running" | "completed" | "pending" | "error"
  progress: number
  startTime: string
  estimatedEnd: string
  vehicles: number
  routes: number
  orders: number
  createdAt: string
}

export interface SimulationMetrics {
  efficiency: number
  completionRate: number
  averageDeliveryTime: number
  resourceUtilization: number
  costOptimization: number
}
