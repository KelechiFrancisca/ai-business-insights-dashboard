function Alerts() {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Alerts</h1>
      <p className="text-gray-600 mb-6">
        Stay informed with intelligent alerts about your business finances.
      </p>

      {/* Priority Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-red-600">High Priority</h2>
          <p className="text-xl font-bold">1</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-600">Medium Priority</h2>
          <p className="text-xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-blue-600">Informational</h2>
          <p className="text-xl font-bold">1</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
          <h3 className="text-lg font-bold text-red-600">Expense Spike Detected</h3>
          <p className="text-gray-700">
            Your expenses increased by 25.6% last month. Review recent transactions to identify unusual spending.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h3 className="text-lg font-bold text-green-600">Healthy Profit Margin</h3>
          <p className="text-gray-700">
            Great job! Your profit margin is 68.1%. Keep up the good financial management.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
