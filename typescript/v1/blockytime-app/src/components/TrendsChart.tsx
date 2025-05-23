import React, { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useTrendService } from '../contexts/ServiceHooks';
import { TrendData, TrendDataPoint } from '../interfaces/trendserviceinterface';
import { TypeModel } from '../models/type';
import { getColorFromDecimal } from '../utils';
import { differenceInDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface TrendsChartProps {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'month';
}

const isEqual = (a: TrendsChartProps, b: TrendsChartProps) => {
  return a.startDate === b.startDate && a.endDate === b.endDate && a.groupBy === b.groupBy;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ startDate, endDate, groupBy }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendData[]>([]);
  const loadingParamsRef = useRef<{ 
    startTimestamp: number; 
    endTimestamp: number; 
    groupBy: string 
  } | null>(null);
  const trendService = useTrendService();
  let daysInPeriod: number[] = [];

  useEffect(() => {

    const currentParams = {
      startTimestamp: startDate.getTime(),
      endTimestamp: endDate.getTime(),
      groupBy
    };

    const paramsMatch = loadingParamsRef.current && 
      loadingParamsRef.current.startTimestamp === currentParams.startTimestamp &&
      loadingParamsRef.current.endTimestamp === currentParams.endTimestamp &&
      loadingParamsRef.current.groupBy === currentParams.groupBy;

    if (!paramsMatch) {
      
      const fetchData = async () => {
        try {
          setLoading(true);
          loadingParamsRef.current = currentParams;
          setError(null);
          const trends = await trendService.getTrends(startDate, endDate, groupBy.toUpperCase() as 'DAY' | 'MONTH');
          // Check if params still match current request
          if (loadingParamsRef.current && 
              loadingParamsRef.current.startTimestamp === currentParams.startTimestamp &&
              loadingParamsRef.current.endTimestamp === currentParams.endTimestamp &&
              loadingParamsRef.current.groupBy === currentParams.groupBy) {
            setData(trends);
          }
        } catch (err) {
          console.error('Error fetching trends:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
          loadingParamsRef.current = null;
        }
      };

      fetchData();
    }
  }, [startDate, endDate, groupBy, trendService]);

  if (data.length > 0) {
    // Calculate days in each period based on time labels
    if (groupBy.toUpperCase() === 'DAY') {
      daysInPeriod = data[0].items.map(_ => 1);
    } else if (groupBy.toUpperCase() === 'MONTH') {
      daysInPeriod = data[0].items.map(item => {
        const start = new Date(item.timeLabel);
        const end = new Date(item.timeLabel);
        end.setMonth(start.getMonth() + 1);
        return differenceInDays(end, start);
      });
    }
  }

  const chartData: ChartData<'line'> = {
    labels: data.length > 0 ? data[0].items.map(item => item.timeLabel) : [],
    datasets: data.map((trendData: TrendData) => {
    const type: TypeModel = trendData.type;
      return {
        label: type.name,
        data: trendData.items.map((item: TrendDataPoint, index: number) => 
          parseFloat((item.duration / daysInPeriod[index]).toFixed(1))
        ),
        borderColor: getColorFromDecimal(type.color),
        backgroundColor: getColorFromDecimal(type.color),
      };
    }),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours per Day'
        }
      }
    }
  };

  if (loading) {
    return <div className="trends-chart-loading">Loading...</div>;
  }

  if (error) {
    return <div className="trends-chart-error">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="trends-chart-empty">No data available for this period</div>;
  }

  return (
    <div className="trends-chart" style={{ height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
