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
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Bar } from 'react-chartjs-2';
import { useStatsService } from '../contexts/ServiceHooks';
import { StatsData } from "../interfaces/statisticsserviceinterface";
import { getColorFromDecimal } from '../utils';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartDataLabels
);

interface StatsChartProps {
  startDate: Date;
  endDate: Date;
  chartType: 'pie' | 'bar';
}

export const StatsChart: React.FC<StatsChartProps> = ({ startDate, endDate, chartType }) => {
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
        console.log(`fetching stats for ${startDateStr} - ${endDateStr}`)
        
        const stats = await statsService.getStats(startDateStr, endDateStr);
        setData(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, statsService]);

  const totalDuration = data.reduce((sum, item) => sum + item.duration, 0); // in hours

  // Calculate the number of days between start and end dates
  const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Convert seconds to hours and divide by number of days
  const getDailyHours = (duration: number) => duration / daysDiff;

  const chartData = {
    labels: data.map(item => item.type.name || 'Unknown'),
    datasets: [
      {
        label: chartType === 'bar' ? 'Average Hours per Day' : undefined,
        data: data.map(item => getDailyHours(item.duration)),
        backgroundColor: data.map(item => getColorFromDecimal(item.type.color) || '#cccccc'),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        display: true,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw * daysDiff; // Convert back to total hours
            const percentage = ((context.raw * daysDiff) / totalDuration * 100).toFixed(1);
            return `${context.label}: ${value.toFixed(1)} total hours (${context.raw.toFixed(1)} hrs/day, ${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 12
        },
        formatter: (value: number, context: any) => {
          const percentage = (value * daysDiff / totalDuration * 100).toFixed(1);
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}\n${percentage}%\n(${value.toFixed(1)} hrs/day)`;
        },
        textAlign: 'center' as const,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw * daysDiff; // Convert back to total hours
            const percentage = ((context.raw * daysDiff) / totalDuration * 100).toFixed(1);
            return `${context.raw.toFixed(1)} hrs/day (${value.toFixed(1)} total, ${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 12
        },
        formatter: (value: number, context: any) => {
          const percentage = (value * daysDiff / totalDuration * 100).toFixed(1);
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}\n${percentage}%\n(${value.toFixed(1)} hrs/day)`;
        },
        textAlign: 'center' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Hours per Day',
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
        <Pie data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

