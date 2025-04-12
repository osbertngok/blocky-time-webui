import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  TooltipItem,
  ChartData as ChartJSData,
  ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Bar } from 'react-chartjs-2';
import { useStatsService } from '../contexts/ServiceHooks';
import { StatsData } from "../interfaces/statisticsserviceinterface";
import { getColorFromDecimal } from '../utils';
import { Context } from 'chartjs-plugin-datalabels';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartDataLabels
);

type ChartType = 'pie' | 'bar';

interface StatsChartProps {
  startDate: Date;
  endDate: Date;
  chartType: ChartType;
  timeSlot?: {
    timeSlotMinutes: number;
    hour: number;
    minute: number;
  };
  title?: string;
}

export const StatsChart: React.FC<StatsChartProps> = ({ 
  startDate, 
  endDate, 
  chartType,
  timeSlot,
  title 
}) => {
  const [data, setData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statsService = useStatsService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        const stats = await statsService.getStats(
          startDateStr, 
          endDateStr,
          timeSlot?.timeSlotMinutes,
          timeSlot?.hour,
          timeSlot?.minute
        );
        setData(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, statsService, timeSlot]);

  const totalDuration = data.reduce((sum, item) => sum + item.duration, 0);
  const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const getDailyHours = (duration: number) => timeSlot ? duration : duration / daysDiff;

  const chartData: ChartJSData<ChartType, number[], string> = {
    labels: data.map(item => item.type.name || 'Unknown'),
    datasets: [
      {
        label: chartType === 'bar' ? (timeSlot ? 'Hours' : 'Average Hours per Day') : undefined,
        data: data.map(item => getDailyHours(item.duration)),
        backgroundColor: data.map(item => getColorFromDecimal(item.type.color) || '#cccccc'),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'right' as const,
        display: true,
      },
      title: {
        display: !!title,
        text: title || ''
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 12
        },
        formatter: (value: number, context: Context) => {
          const totalValue = timeSlot ? value : value * daysDiff;
          const percentage = (totalValue / totalDuration * 100).toFixed(1);
          const label = context.chart.data.labels?.[context.dataIndex];
          return `${label}\n${percentage}%\n(${value.toFixed(1)} hrs${timeSlot ? '' : '/day'})`;
        },
        textAlign: 'center' as const,
      },
    },
  };

  const pieOptions: ChartOptions<'pie'> = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = timeSlot ? 
              context.raw as number : 
              (context.raw as number) * daysDiff;
            const percentage = (value / totalDuration * 100).toFixed(1);
            const hourRate = context.raw as number;
            return `${context.label}: ${value.toFixed(1)} total hours (${hourRate.toFixed(1)} hrs${timeSlot ? '' : '/day'}, ${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions: ChartOptions<'bar'> = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = timeSlot ? 
              context.raw as number : 
              (context.raw as number) * daysDiff;
            const percentage = (value / totalDuration * 100).toFixed(1);
            const hourRate = context.raw as number;
            return `${context.label}: ${value.toFixed(1)} total hours (${hourRate.toFixed(1)} hrs${timeSlot ? '' : '/day'}, ${percentage}%)`;
          },
        },
      },
    },
  };

  const options = chartType === 'pie' ? pieOptions : barOptions;

  if (loading) {
    return <div className="stats-chart-loading">Loading...</div>;
  }

  if (error) {
    return <div className="stats-chart-error">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="stats-chart-empty">No data available for this period</div>;
  }

  return (
    <div className="stats-chart" style={{ height: '400px' }}>
      {chartType === 'pie' ? (
        <Pie data={chartData as ChartJSData<'pie', number[], string>} options={options as ChartOptions<'pie'>} />
      ) : (
        <Bar data={chartData as ChartJSData<'bar', number[], string>} options={options as ChartOptions<'bar'>} />
      )}
    </div>
  );
};

export default StatsChart;

