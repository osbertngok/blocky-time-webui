import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import SleepDataControl from './SleepDataControl';
import SleepDataChart from './SleepDataChart';

interface SleepData {
  start_moving_avg: number[];
  end_moving_avg: number[];
  duration_moving_avg: number[];
  moving_avg_dates: string[];
  start_hours: number[];
  end_hours: number[];
}

export const SleepDataSection: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(dayjs().startOf('year').toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().add(1, 'day').toDate());
  const [sleepData, setSleepData] = useState<SleepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decayFactor, setDecayFactor] = useState<number>(0.75);
  const [windowSize, setWindowSize] = useState<number>(14);

  useEffect(() => {
    const fetchSleepData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/v1/sleep/stats?start_date=${format(startDate, 'yyyy-MM-dd')}` +
          `&end_date=${format(endDate, 'yyyy-MM-dd')}` +
          `&decay_factor=${decayFactor}` +
          `&window_size=${windowSize}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch sleep data');
        }
        const data = await response.json();
        setSleepData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSleepData();
  }, [startDate, endDate, decayFactor, windowSize]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Sleep Data</h2>
      <SleepDataControl
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        decayFactor={decayFactor}
        windowSize={windowSize}
        onDecayFactorChange={setDecayFactor}
        onWindowSizeChange={setWindowSize}
      />
      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-red-500 py-4">{error}</div>}
      {sleepData && !loading && !error && (
        <SleepDataChart
          startMovingAvg={sleepData.start_moving_avg}
          endMovingAvg={sleepData.end_moving_avg}
          durationMovingAvg={sleepData.duration_moving_avg}
          movingAvgDates={sleepData.moving_avg_dates}
          startHours={sleepData.start_hours}
          endHours={sleepData.end_hours}
        />
      )}
    </div>
  );
};

export default SleepDataSection; 