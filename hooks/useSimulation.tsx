import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface SimulationContextType {
  simulationType: string;
  setSimulationType: (type: string) => void;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  status: string;
  setStatus: (s: string) => void;
  duration: number;
  minutosPorIteracion: number;
  setMinutosPorIteracion: (m: number) => void;
  resetSimulation: () => void;
}

export const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulationType, setSimulationType] = useState("semanal");
  const [currentTime, setCurrentTime] = useState(0); // en minutos
  const [status, setStatus] = useState("paused"); // running, paused, finished
  const [minutosPorIteracion, setMinutosPorIteracion] = useState(10); // valor fijo por defecto
  const duration = 1440; // 1 día en minutos (ajusta si quieres 7 días: 168*60)

  // Timer automático
  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration) {
          setStatus("finished");
          clearInterval(interval);
          return prev;
        }
        return prev + minutosPorIteracion; // Avanza minutosPorIteracion por tick
      });
    }, 1000); // 1 segundo real = minutosPorIteracion simulados
    return () => clearInterval(interval);
  }, [status, minutosPorIteracion]);

  // Reset al cambiar de simulación
  const resetSimulation = () => {
    setCurrentTime(0);
    setStatus("paused");
  };

  return (
    <SimulationContext.Provider value={{
      simulationType, setSimulationType,
      currentTime, setCurrentTime,
      status, setStatus,
      duration,
      minutosPorIteracion, setMinutosPorIteracion,
      resetSimulation
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextType {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation debe usarse dentro de SimulationProvider");
  return ctx;
} 