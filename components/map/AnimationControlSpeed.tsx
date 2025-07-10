// components/map/AnimationSpeedControl.tsx
import React from 'react';
import { Gauge, Play, Pause, Zap, Turtle, Rabbit } from 'lucide-react';

interface AnimationSpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const AnimationSpeedControl: React.FC<AnimationSpeedControlProps> = ({
  speed,
  onSpeedChange,
  isPlaying,
  onTogglePlay
}) => {
  const speedOptions = [
    { value: 0.1, label: 'Muy Lento', icon: Turtle, color: 'text-blue-600' },
    { value: 0.3, label: 'Lento', icon: Turtle, color: 'text-green-600' },
    { value: 0.5, label: 'Normal', icon: Play, color: 'text-yellow-600' },
    { value: 1.0, label: 'Rápido', icon: Rabbit, color: 'text-orange-600' },
    { value: 2.0, label: 'Muy Rápido', icon: Zap, color: 'text-red-600' }
  ];

  const currentOption = speedOptions.find(opt => opt.value === speed) || speedOptions[1];

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        {/* Botón de play/pause */}
        <button
          onClick={onTogglePlay}
          className={`p-2 rounded-lg transition-all ${
            isPlaying 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title={isPlaying ? 'Pausar simulación' : 'Continuar simulación'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Separador */}
        <div className="w-px h-6 bg-gray-300"></div>

        {/* Icono de velocidad actual */}
        <div className={`p-2 rounded-lg bg-gray-50 ${currentOption.color}`}>
          <currentOption.icon size={16} />
        </div>

        {/* Selector de velocidad */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Velocidad de Animación</label>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {speedOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Slider de velocidad */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600 mb-1">Ajuste Fino</span>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((speed - 0.1) / 1.9) * 100}%, #e5e7eb ${((speed - 0.1) / 1.9) * 100}%, #e5e7eb 100%)`
            }}
          />
          <span className="text-xs font-mono text-gray-500 mt-1">{speed.toFixed(1)}x</span>
        </div>

        {/* Indicador visual */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600 mb-1">Estado</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs">
              {isPlaying ? 'Activo' : 'Pausado'}
            </span>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Velocidad afecta solo la animación visual</div>
          <div>• Los datos del backend no se modifican</div>
          <div>• {currentOption.label}: {speed}x velocidad normal</div>
        </div>
      </div>
    </div>
  );
};

export default AnimationSpeedControl;