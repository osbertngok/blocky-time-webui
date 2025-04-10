import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTrendService } from '../contexts/ServiceHooks';
import { TrendItemModel } from '../models/trenditem';
import { getColorFromDecimal } from '../utils';
import { ChartData, Point } from 'chart.js';
import { TrendData, TrendDataPoint } from '../interfaces/trendserviceinterface';
import { TypeModel } from '../models/type';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendsChartProps {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'month';
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ startDate, endDate, groupBy }) => {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trendService = useTrendService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure we're working with Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Convert groupBy to match service expectations
        const serviceGroupBy = groupBy.toUpperCase() as 'DAY' | 'MONTH';
        
        const trends: TrendData[] = await trendService.getTrends(start, end, serviceGroupBy);
        setData(trends);
      } catch (err) {
        console.error('Error fetching trends:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, groupBy, trendService]);


  const chartData: ChartData<"line", (number | Point | null)[], string> = {
    labels: data.length > 0 ? data[0].items.map(item => item.timeLabel) : [],
    datasets: data.map((trenData: TrendData) => {
      const type: TypeModel = trenData.type;
      return {
        label: type.name,
        data: trenData.items.map((item: TrendDataPoint) => item.duration),
        borderColor: getColorFromDecimal(type.color),
        backgroundColor: getColorFromDecimal(type.color),
        fill: true,
      };
    }),
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
            return `${context.dataset.label}: ${context.raw.toFixed(1)} hours`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
    },
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
