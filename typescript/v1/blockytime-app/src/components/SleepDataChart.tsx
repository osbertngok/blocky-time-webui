import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
);

interface SleepDataChartProps {
  startMovingAvg: number[];
  endMovingAvg: number[];
  durationMovingAvg: number[];
  movingAvgDates: string[];
  startHours: number[];
  endHours: number[];
}

export const SleepDataChart: React.FC<SleepDataChartProps> = ({
  startMovingAvg,
  endMovingAvg,
  durationMovingAvg,
  movingAvgDates,
  startHours,
  endHours,
}) => {
  const chartData: ChartData<'scatter'> = {
    datasets: [
      {
        type: 'scatter',
        label: 'Sleep Start',
        data: startHours.map((hour, index) => ({
          x: index,
          y: hour,
        })),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        type: 'scatter',
        label: 'Sleep End',
        data: endHours.map((hour, index) => ({
          x: index,
          y: hour,
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        type: 'scatter',
        label: 'Start Moving Avg',
        data: startMovingAvg.map((hour, index) => ({
          x: index,
          y: hour,
        })),
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        showLine: true,
        fill: false,
      },
      {
        type: 'scatter',
        label: 'End Moving Avg',
        data: endMovingAvg.map((hour, index) => ({
          x: index,
          y: hour,
        })),
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        showLine: true,
        fill: false,
      },
      {
        type: 'scatter',
        label: 'Duration Moving Avg',
        data: durationMovingAvg.map((hour, index) => ({
          x: index,
          y: hour,
        })),
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        showLine: true,
        fill: false,
        yAxisID: 'duration',
      },
    ],
  };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'category',
        labels: movingAvgDates,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Hour of Day',
        },
        min: 0,
        max: 24,
      },
      duration: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Duration (hours)',
        },
        min: 0,
        max: 12,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="h-[400px]">
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default SleepDataChart; 