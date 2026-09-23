import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCheckCircle, FaExclamationTriangle, FaBuilding, FaCoins, FaDatabase, FaLock, FaTags } from "react-icons/fa";
import API_BASE_URL from "./apiConfig";

const currencySymbols = {
  USD: "$", EUR: "€", GBP: "£", CAD: "C$", JPY: "¥",
  NGN: "₦", ZAR: "R", KES: "KSh", GHS: "₵", EGP: "£E",
  XOF: "CFA", XAF: "CFA"
};

function formatAmount(amount, currency = "USD") {
  const symbol = currencySymbols[currency] || "";
  return `${symbol}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Settings() {
  const [businessName, setBusinessName] = useState("");
  const getInitialCurrency = () => {
    const locale = navigator.language || "en-US";
    if (locale.toLowerCase().includes("ng")) return "NGN";
    if (locale.toLowerCase().includes("gh")) return "GHS";
    if (locale.toLowerCase().includes("ke")) return "KES";
    if (locale.toLowerCase().includes("za")) return "ZAR";
    return "USD";
  };
  const [currency, setCurrency] = useState(getInitialCurrency());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(["Sales", "Rent", "Food", "Transport", "Utilities", "Marketing"]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${API_BASE_URL}/settings`, {
      headers: { Authorization: "Bearer " + token },
    })
  .then((res) => res.json())
  .then((data) => {
        setBusinessName(data.business_name || "");
        setCurrency(data.currency || getInitialCurrency());
        setLoading(false);
      })
  .catch(() => setLoading(false));

        // REAL: Backend only - now that migration works
    fetch(`${API_BASE_URL}/categories`, {
      headers: { Authorization: "Bearer " + token },
    })
   .then(res => res.json())
   .then(data => {
      if (Array.isArray(data)) {
        setCategories(data.map(c => c.name));
      }
    })
   .catch(() => toast.error("Failed to load categories"));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toast.warn("Please enter a business name");
      return;
    }
    setSaving(true);
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ business_name: businessName.trim(), currency }),
    })
  .then((res) => res.json())
  .then((data) => {
        toast.success(
          <div className="flex items-center space-x-2 font-bold">
            <FaCheckCircle className="text-green-600" />
            <span>{data.message || "Settings saved!"}</span>
          </div>
        );
      })
  .catch(() => toast.error("Failed to save settings."))
  .finally(() => setSaving(false));
  };

  const handleClearEntries = () => {
    if (window.confirm("Clear all transactions? This cannot be undone.")) {
      const token = localStorage.getItem("token");
      fetch(`${API_BASE_URL}/clear_entries`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      })
    .then(() => toast.info("Transactions cleared!"))
    .catch(() => toast.error("Failed to clear transactions."));
    }
  };

  const confirmClearAll = () => {
    if (confirmText!== "RESET") {
      toast.warn(
        <div className="flex items-center space-x-2 font-bold">
          <FaExclamationTriangle className="text-yellow-500" />
          <span>You must type RESET to confirm.</span>
        </div>
      );
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/clear_all`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
  .then(() => {
        toast.success("All data cleared successfully!");
        setShowModal(false);
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 2000);
      })
  .catch(() => toast.error("Failed to clear all data."));
  };

    const handleAddCategory = async () => {
    const catName = newCategory.trim();
    if (!catName) return toast.warn("Enter category name");
    if (categories.includes(catName)) return toast.warn("Category already exists");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ name: catName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      
      setCategories([...categories, data.name]);
      setNewCategory("");
      toast.success("Category added — saved to database!");
    } catch (err) {
      toast.error(err.message);
    }
  };

    const handleDeleteCategory = async (catToDelete) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${encodeURIComponent(catToDelete)}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to delete");
      
      setCategories(categories.filter(c => c!== catToDelete));
      toast.info("Category removed from database");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="bg-[#f6f7f9] min-h-screen p-6 text-[15px]">
      <nav className="bg-white border border-gray-200 shadow-sm rounded-xl mb-6 p-4 flex justify-between items-center">
        <h1 className="text-[16px] font-semibold tracking-tight text-gray-900">
          {businessName || "Business Dashboard"} <span className="text-gray-400 font-normal">• {currencySymbols[currency]}</span>
        </h1>
        <div className="flex gap-1.5 flex-wrap">
          <a href="/dashboard" className="px-3.5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-900 hover:text-white font-medium transition text-[14px]">Dashboard</a>
          <a href="/forecast" className="px-3.5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-900 hover:text-white font-medium transition text-[14px]">Forecast</a>
          <a href="/alerts" className="px-3.5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-900 hover:text-white font-medium transition text-[14px]">Alerts</a>
          <a href="/settings" className="px-3.5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-[14px]">Settings</a>
        </div>
      </nav>

      <h1 className="text-[22px] font-bold tracking-tight mb-1 text-gray-900">Settings</h1>
      <p className="text-[14px] text-gray-500 mb-6 font-medium">Manage your business profile and data.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FaBuilding className="text-gray-400 text-[13px]" />
            <h2 className="text-[12px] uppercase tracking-widest font-semibold text-gray-500">Business Name</h2>
          </div>
          <p className="text-[18px] font-bold text-gray-900 truncate">{businessName || "Not Set"}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FaCoins className="text-gray-400 text-[13px]" />
            <h2 className="text-[12px] uppercase tracking-widest font-semibold text-gray-500">Currency</h2>
          </div>
          <p className="text-[18px] font-bold text-gray-900">{currency || "Not Set"} {currencySymbols[currency]}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FaDatabase className="text-gray-400 text-[13px]" />
            <h2 className="text-[12px] uppercase tracking-widest font-semibold text-gray-500">Data Status</h2>
          </div>
          <p className="text-[18px] font-bold text-emerald-600">Active</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-6">
        <h2 className="text-[16px] font-semibold mb-4 text-gray-900">Business Information</h2>
        {loading? (
          <p className="font-medium animate-pulse text-[14px] text-gray-500">Loading...</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 font-medium mb-1.5 text-[14px]">Business Name</label>
              <input
                type="text"
                placeholder="e.g. Divine Ventures"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-[15px]"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1.5 text-[14px]">Currency</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-[15px]"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD (C$) - Canadian Dollar</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
                <option value="ZAR">ZAR (R) - South African Rand</option>
                <option value="KES">KES (KSh) - Kenyan Shilling</option>
                <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                <option value="EGP">EGP (£E) - Egyptian Pound</option>
                <option value="XOF">XOF (CFA) - West African CFA</option>
                <option value="XAF">XAF (CFA) - Central African CFA</option>
              </select>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg">
              <p className="text-[12px] uppercase tracking-widest font-semibold text-gray-500">Preview:</p>
              <p className="text-[15px] font-bold text-gray-900 mt-1">{formatAmount(12500.5, currency)} • {formatAmount(1000000, currency)}</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black font-medium disabled:opacity-50 transition text-[15px]"
            >
              {saving? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FaTags className="text-gray-400 text-[13px]" />
          <h2 className="text-[16px] font-semibold text-gray-900">Manage Categories</h2>
        </div>
        <p className="text-[14px] text-gray-500 mb-4 font-medium">Add categories for income and expenses. Dashboard will show them as dropdown (fixes Tester #7).</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="e.g. Marketing, Logistics"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-[15px]"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
          />
          <button
            onClick={handleAddCategory}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black font-medium transition text-[14px]"
          >
            Add Category
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {categories.map(cat => (
            <span key={cat} className="bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-full text-[14px] font-medium flex items-center gap-2">
              {cat}
              <button onClick={() => handleDeleteCategory(cat)} className="text-gray-400 hover:text-red-600 font-bold ml-1 text-[16px]">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FaLock className="text-gray-400 text-[13px]" />
          <h2 className="text-[16px] font-semibold text-gray-900">Data Security & Storage</h2>
        </div>
        <p className="text-[14px] text-gray-500 mb-3 font-medium">Real explanation you can give to your client (Tester #8).</p>
        <ul className="text-[14px] text-gray-700 space-y-2.5 list-disc pl-5 font-medium leading-relaxed">
          <li><span className="font-semibold text-gray-900">Your own database:</span> Every user has isolated data — all queries filter by <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[13px]">user_id</code>. You cannot see another business data.</li>
          <li><span className="font-semibold text-gray-900">Password protection:</span> Passwords are hashed with bcrypt, never saved as plain text.</li>
          <li><span className="font-semibold text-gray-900">Login check:</span> Every API call verifies JWT token via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[13px]">verify_token_and_get_user</code>. No token = no data.</li>
          <li><span className="font-semibold text-gray-900">Hosting:</span> Backend on Render, frontend on Vercel/Render — both use HTTPS in production.</li>
          <li><span className="font-semibold text-gray-900">CSV import:</span> File is read in memory and processed, never saved on server disk.</li>
          <li><span className="font-semibold text-gray-900">Your control:</span> You can clear transactions or reset everything anytime. No data shared with third parties.</li>
        </ul>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-6">
        <h2 className="text-[16px] font-semibold mb-1 text-gray-900">Data Management</h2>
        <p className="text-gray-500 mb-4 font-medium text-[14px]">Clear transaction history but keep your settings.</p>
        <button
          className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 font-medium transition text-[14px]"
          onClick={handleClearEntries}
        >
          Clear Transactions
        </button>
      </div>

      <div className="bg-white border border-red-200 p-6 rounded-xl shadow-sm">
        <h2 className="text-[16px] font-semibold mb-1 text-red-700">Danger Zone</h2>
        <p className="text-red-600 mb-4 font-medium text-[14px]">
          Reset Everything will permanently delete all transactions, alerts, and settings. This cannot be undone.
        </p>
        <button
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium transition text-[14px]"
          onClick={() => setShowModal(true)}
        >
          Reset Everything
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <h2 className="text-[18px] font-bold mb-2 text-red-700">Confirm Reset</h2>
            <p className="text-gray-700 mb-4 font-medium text-[14px]">
              Type <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">RESET</span> to confirm permanent deletion.
            </p>
            <input
              type="text"
              placeholder="Type RESET"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 mb-4 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-[15px]"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2.5 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition text-[14px]"
                onClick={() => { setShowModal(false); setConfirmText(""); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition text-[14px]"
                onClick={confirmClearAll}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Settings;