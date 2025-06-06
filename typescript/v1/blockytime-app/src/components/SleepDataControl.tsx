import React from 'react';
import { format } from 'date-fns';

interface SleepDataControlProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  decayFactor: number;
  windowSize: number;
  onDecayFactorChange: (value: number) => void;
  onWindowSizeChange: (value: number) => void;
}

export const SleepDataControl: React.FC<SleepDataControlProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  decayFactor,
  windowSize,
  onDecayFactorChange,
  onWindowSizeChange,
}) => {
  return (
    <div className="flex gap-4 mb-6 items-end flex-wrap">
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={(e) => onStartDateChange(new Date(e.target.value))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={format(endDate, 'yyyy-MM-dd')}
          onChange={(e) => onEndDateChange(new Date(e.target.value))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="decayFactor" className="block text-sm font-medium text-gray-700 mb-1">
          Decay Factor
        </label>
        <input
          type="range"
          id="decayFactor"
          min={0}
          max={1}
          step={0.05}
          value={decayFactor}
          onChange={(e) => onDecayFactorChange(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-xs text-gray-600 mt-1">{decayFactor.toFixed(2)}</span>
      </div>
      <div className="flex flex-col">
        <label htmlFor="windowSize" className="block text-sm font-medium text-gray-700 mb-1">
          Window Size
        </label>
        <input
          type="range"
          id="windowSize"
          min={1}
          max={30}
          step={1}
          value={windowSize}
          onChange={(e) => onWindowSizeChange(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-xs text-gray-600 mt-1">{windowSize}</span>
      </div>
    </div>
  );
};

export default SleepDataControl; 