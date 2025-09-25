import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export type ImagePosition = 'left' | 'center' | 'right';

interface PositionSelectorProps {
  label: string;
  value: ImagePosition;
  onChange: (position: ImagePosition) => void;
  className?: string;
}

export const PositionSelector: React.FC<PositionSelectorProps> = ({
  label,
  value,
  onChange,
  className = ''
}) => {
  const positions: { value: ImagePosition; icon: React.ReactNode; label: string }[] = [
    { value: 'left', icon: <AlignLeft className="w-4 h-4" />, label: 'Left' },
    { value: 'center', icon: <AlignCenter className="w-4 h-4" />, label: 'Center' },
    { value: 'right', icon: <AlignRight className="w-4 h-4" />, label: 'Right' },
  ];

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-1">
        {positions.map((position) => (
          <button
            key={position.value}
            onClick={() => onChange(position.value)}
            className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
              value === position.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={position.label}
          >
            <div className="flex items-center justify-center space-x-1">
              {position.icon}
              <span>{position.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};