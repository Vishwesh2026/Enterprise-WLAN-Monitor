import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, BarElement);

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
  hover: { mode: "nearest", intersect: false },
  animation: { duration: 250 },
  scales: {
    x: { display: false },
    y: { display: false, min: 0, max: 100 },
  },
};

export function SignalChart({ points = [], color = "#1976D2" }) {
  const data = React.useMemo(() => ({
    labels: points.map((_, i) => i + 1),
    datasets: [{ data: points, borderColor: color, backgroundColor: `${color}33`, fill: true, tension: 0.3, pointRadius: 0 }],
  }), [points, color]);
  return <div className="h-[140px]"><Line data={data} options={baseOpts} /></div>;
}

export function BandwidthChart({ points = [], color = "#388E3C" }) {
  const data = React.useMemo(() => ({
    labels: points.map((_, i) => i + 1),
    datasets: [{ data: points, borderColor: color, backgroundColor: `${color}33`, fill: true, tension: 0.3, pointRadius: 0 }],
  }), [points, color]);
  return <div className="h-[140px]"><Line data={data} options={baseOpts} /></div>;
}

export function AlertsChart({ bars = [], color = "#F44336" }) {
  const data = React.useMemo(() => ({
    labels: bars.map((_, i) => i + 1),
    datasets: [{ data: bars, backgroundColor: `${color}55`, borderColor: color }],
  }), [bars, color]);
  const opts = React.useMemo(() => ({
    ...baseOpts,
    scales: { x: { display: false }, y: { display: true, beginAtZero: true } },
  }), []);
  return <div className="h-[140px]"><Bar data={data} options={opts} /></div>;
}