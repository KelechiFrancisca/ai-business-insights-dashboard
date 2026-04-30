function Settings() {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Settings</h1>

      {/* Business Info */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Business Information</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700">Business Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-700">Currency</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Save Settings
          </button>
        </form>
      </div>

      {/* Data Management */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <p className="text-gray-700 mb-4">Total Transactions: 10 records</p>
        <button className="bg-red-600 text-white px-4 py-2 rounded">
          Clear All Data
        </button>
      </div>

      {/* About */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <p className="text-gray-700">
          Financial Tracker for Small Businesses Version 1.0.0. This app helps small business owners manage finances.
        </p>
      </div>
    </div>
  );
}

export default Settings;
