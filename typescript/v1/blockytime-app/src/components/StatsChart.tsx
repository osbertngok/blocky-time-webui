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
import { Pie, Bar } from 'react-chartjs-2';
import { useStatsService } from '../contexts/ServiceHooks';
import { StatsData } from "../interfaces/statisticsserviceinterface";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hours`;
  };

  const chartData = {
    labels: data.map(item => item.type.name || 'Unknown'),
    datasets: [
      {
        data: data.map(item => item.duration / 3600), // Convert to hours
        backgroundColor: data.map(item => item.type.color || '#cccccc'),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const hours = context.raw;
            return `${context.label}: ${hours.toFixed(1)} hours`;
          },
        },
      },
    },
    ...(chartType === 'bar' && {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours',
          },
        },
      },
    }),
  };

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
