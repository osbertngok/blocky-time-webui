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

  // Calculate dynamic min/max for left y axis (start/end times)
  const leftValues = [
    ...startHours,
    ...endHours,
    ...startMovingAvg,
    ...endMovingAvg,
  ];
  const leftMin = Math.floor(Math.min(...leftValues)) - 1;
  const leftMax = Math.ceil(Math.max(...leftValues)) + 1;

  // Calculate dynamic min/max for right y axis (duration)
  const rightValues = durationMovingAvg;
  const rightMin = Math.floor(Math.min(...rightValues)) - 1;
  const rightMax = Math.ceil(Math.max(...rightValues)) + 1;

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: false,
      },
      datalabels: {
        display: false,
      },
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
        min: leftMin,
        max: leftMax,
      },
      duration: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Duration (hours)',
        },
        min: rightMin,
        max: rightMax,
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