import { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Forecast() {
  const [projectionType, setProjectionType] = useState("line");

  const profitProjectionData = {
    labels: ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"],
    datasets: [
      {
        label: "Projected Profit",
        data: [3600, 3700, 3550, 3400, 3450, 3500],
        borderColor: "rgba(34,197,94,0.7)",
        backgroundColor: "rgba(34,197,94,0.2)",
        fill: projectionType === "line",
        tension: 0.3,
      },
    ],
  };

  const revenueExpenseData = {
    labels: ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"],
    datasets: [
      {
        label: "Actual Revenue",
        data: [5000, 5200, 5400, 5600, 5800, 6000],
        borderColor: "rgba(34,197,94,0.8)",
        tension: 0.3,
      },
      {
        label: "Actual Expenses",
        data: [3000, 3100, 3200, 3300, 3400, 3500],
        borderColor: "rgba(239,68,68,0.8)",
        tension: 0.3,
      },
      {
        label: "Forecast Revenue",
        data: [6100, 6300, 6500, 6700, 6900, 7100],
        borderColor: "rgba(59,130,246,0.7)",
        borderDash: [5, 5],
        tension: 0.3,
      },
      {
        label: "Forecast Expenses",
        data: [3600, 3700, 3800, 3900, 4000, 4100],
        borderColor: "rgba(147,51,234,0.6)",
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => `$${value}` },
      },
    },
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">AI-Powered Forecast</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Current Avg Profit</h2>
          <p className="text-2xl font-bold text-green-600">$3,633.33</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Projected Profit (3 months)</h2>
          <p className="text-2xl font-bold text-blue-600">$3,450.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700">Change</h2>
          <p className="text-2xl font-bold text-red-600">-5.0%</p>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        This forecast uses historical data to project future performance. Confidence intervals show the range of possible outcomes.
      </p>

      {/* Profit Projection with Toggle */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Profit Projection</h2>
          <div className="space-x-2">
            <button
              onClick={() => setProjectionType("line")}
              className={`px-3 py-1 rounded ${
                projectionType === "line"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setProjectionType("bar")}
              className={`px-3 py-1 rounded ${
                projectionType === "bar"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        {projectionType === "line" ? (
          <Line data={profitProjectionData} options={options} />
        ) : (
          <Bar data={profitProjectionData} options={options} />
        )}
      </div>

      {/* Revenue & Expenses Forecast */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Revenue & Expenses Forecast</h2>
        <Line data={revenueExpenseData} options={options} />
      </div>
    </div>
  );
}

export default Forecast;
