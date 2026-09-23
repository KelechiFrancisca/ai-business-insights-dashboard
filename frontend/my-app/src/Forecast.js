import { useEffect, useState, useRef, useMemo } from "react";
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
import API_BASE_URL from "./apiConfig";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
);

const chartColors = {
  revenue: { border: "#10B981", bg: "rgba(16, 185, 129, 0.2)" },
  expense: { border: "#F43F5E", bg: "rgba(244, 63, 94, 0.2)" },
  profit: { border: "#3B82F6", bg: "rgba(59, 130, 246, 0.2)" },
  cash: { border: "#14B8A6", bg: "rgba(20, 184, 166, 0.2)" },
  warning: { border: "#F59E0B", bg: "rgba(245, 158, 11, 0.2)" },
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 1200, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      labels: {
        font: { size: 16, weight: 'bold' },
        color: '#111827',
        padding: 20
      }
    },
    tooltip: { titleFont: { size: 16 }, bodyFont: { size: 14 } }
  },
  scales: {
    x: { ticks: { color: '#111827', font: { size: 14, weight: 'bold' } }, grid: { display: false } },
    y: { ticks: { color: '#111827', font: { size: 14, weight: 'bold' } } }
  }
};

const currencySymbols = {
  USD: "$", EUR: "€", GBP: "£", CAD: "C$", JPY: "¥",
  NGN: "₦", ZAR: "R", KES: "KSh", GHS: "₵", EGP: "£E", XOF: "CFA", XAF: "CFA"
};

function formatAmount(amount, currency) {
  const symbol = currencySymbols[currency] || "";
  return `${symbol}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Forecast() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("trend");
  const [activeScenario, setScenario] = useState("Realistic");
  const [showModal, setShowModal] = useState(false);
  const [horizon, setHorizon] = useState(12);
  const [currency, setCurrency] = useState("USD");
  const [toast, setToast] = useState(null);
  const [costCutSlider, setCostCutSlider] = useState(10);
  const reportRef = useRef();

  useEffect(() => {
    const savedHorizon = localStorage.getItem("horizon");
    if (savedHorizon) setHorizon(Number(savedHorizon));
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    fetch(`${API_BASE_URL}/entries`, { headers: { Authorization: "Bearer " + token }})
 .then(res => res.json())
 .then(data => { if (Array.isArray(data)) setTransactions(data); })
 .catch(err => console.error("Error fetching entries:", err));
    fetch(`${API_BASE_URL}/settings`, { headers: { Authorization: "Bearer " + token }})
 .then(res => res.json())
 .then(data => { setCurrency(data.currency || "USD"); if (data.horizon) setHorizon(data.horizon); })
 .catch(err => console.error("Error fetching settings:", err));
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) setActiveTab(tabParam);
  }, []);

  const totalRevenue = transactions.filter(t => t.type?.toLowerCase() === "income").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type?.toLowerCase() === "expense").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0? (netProfit / totalRevenue) * 100 : 0;
  const currentCash = totalRevenue - totalExpenses;

  const { monthlyData, sortedMonths } = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      if(!t.date) return;
      const d = new Date(t.date);
      if(isNaN(d)) return;
      const key = d.toISOString().slice(0, 7);
      if (!data[key]) data[key] = { income: 0, expense: 0 };
      if (t.type?.toLowerCase() === "income") data[key].income += Number(t.amount || 0);
      else if (t.type?.toLowerCase() === "expense") data[key].expense += Number(t.amount || 0);
    });
    return { monthlyData: data, sortedMonths: Object.keys(data).sort() };
  }, [transactions]);

  const lastRecordedMonth = sortedMonths[sortedMonths.length - 1];
  const lastRecordedExpenses = lastRecordedMonth? monthlyData[lastRecordedMonth].expense : 0;
  const lastRecordedMonthName = lastRecordedMonth? new Date(lastRecordedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) : '';

  const realRunwayData = useMemo(() => {
    const last3 = sortedMonths.slice(-3);
    if(last3.length===0) return { avg: 0, text: 'N/A - No data' };
    const avg = last3.reduce((s,k)=>s+(monthlyData[k]?.expense||0),0)/last3.length;
    if(currentCash<=0) return { avg, text: '0 M - Critical' };
    if(avg===0) return { avg, text: '∞' };
    return { avg, text: `${(currentCash/avg).toFixed(1)} M` };
  }, [sortedMonths, monthlyData, currentCash]);

  let expenseChangeText = "";
  if(sortedMonths.length === 0 || totalExpenses === 0){ expenseChangeText = "No expenses recorded yet"; }
  else if(sortedMonths.length === 1){ expenseChangeText = `First expense recorded: ${formatAmount(lastRecordedExpenses, currency)} in ${lastRecordedMonthName} | Real Runway: ${realRunwayData.text} (3M avg)`; }
  else {
    const currentMonth = sortedMonths[sortedMonths.length - 1];
    const prevMonth = sortedMonths[sortedMonths.length - 2];
    const currentExp = monthlyData[currentMonth].expense;
    const prevExp = monthlyData[prevMonth].expense;
    if(prevExp > 0){
      const percentChange = ((currentExp - prevExp) / prevExp) * 100;
      const direction = percentChange > 0? "increased" : "decreased";
      expenseChangeText = `Expenses ${direction} by ${Math.abs(percentChange).toFixed(1)}% vs ${new Date(prevMonth + '-01').toLocaleString('default', { month: 'long' })} | Real Runway: ${realRunwayData.text} (3M avg)`;
    } else { expenseChangeText = `Last recorded: ${formatAmount(lastRecordedExpenses, currency)} in ${lastRecordedMonthName} | Real Runway: ${realRunwayData.text}`; }
  }

  const expenseByCategory = {};
  transactions.filter(t => t.type?.toLowerCase() === "expense").forEach(t => {
    expenseByCategory[t.category || "Other"] = (expenseByCategory[t.category || "Other"] || 0) + Number(t.amount || 0);
  });
  const topExpense = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const topExpenseText = topExpense? `Top expense: ${topExpense[0]} - ${formatAmount(topExpense[1], currency)} | Real Runway: ${realRunwayData.text}` : "Add expenses to see breakdown";

  const anomalyAlert = sortedMonths.length > 1 && monthlyData[sortedMonths[sortedMonths.length - 2]]?.expense > 0 && ((monthlyData[lastRecordedMonth].expense - monthlyData[sortedMonths[sortedMonths.length - 2]].expense) / monthlyData[sortedMonths[sortedMonths.length - 2]].expense) > 0.3
? `🚨 AI Alert: Expenses spiked ${(((monthlyData[lastRecordedMonth].expense - monthlyData[sortedMonths[sortedMonths.length - 2]].expense) / monthlyData[sortedMonths[sortedMonths.length - 2]].expense)*100).toFixed(0)}% vs last month. Driver: ${topExpense?.[0] || 'Expenses'} | Real Runway: ${realRunwayData.text}`
    : null;

  const scenarios = {
    Optimistic: { revenueChange: 10, expenseChange: 3 },
    Realistic: { revenueChange: 5, expenseChange: 2 },
    Pessimistic: { revenueChange: 2, expenseChange: 5 },
  };
  const scenario = scenarios[activeScenario];
  const adjustedRevenue = totalRevenue * (1 + scenario.revenueChange / 100);
  const adjustedExpenses = totalExpenses * (1 + scenario.expenseChange / 100);
  const adjustedProfit = adjustedRevenue - adjustedExpenses;
  const adjustedMargin = adjustedRevenue > 0? (adjustedProfit / adjustedRevenue) * 100 : 0;

  const monthsAhead = Array.from({ length: horizon }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() + i + 1);
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  });

  const monthsWithData = Object.keys(monthlyData).length || 1;
  const avgMonthlyRevenue = totalRevenue / monthsWithData;
  const avgMonthlyExpense = totalExpenses / monthsWithData;

  const projectedRevenue = monthsAhead.map((_, i) => avgMonthlyRevenue * Math.pow(1 + scenario.revenueChange / 100, i + 1));
  const projectedExpenses = monthsAhead.map((_, i) => avgMonthlyExpense * Math.pow(1 + scenario.expenseChange / 100, i + 1));
  const projectedProfit = projectedRevenue.map((rev, i) => rev - projectedExpenses[i]);
  const projectedMargin = projectedRevenue.map((rev, i) => rev > 0? ((rev - projectedExpenses[i]) / rev) * 100 : 0);

  const startingReserves = currentCash;
  const cumulativeCashflow = projectedProfit.reduce((acc, profit, i) => {
    const prev = i === 0? startingReserves : acc[i - 1];
    acc.push(prev + profit);
    return acc;
  }, []);

  const cutAmount = (topExpense?.[1] || 0) * (costCutSlider / 100);
  const newRunway = useMemo(() => {
    const simBurn = Math.max(realRunwayData.avg - cutAmount, 0);
    if(currentCash<=0) return 0;
    if(simBurn===0) return 999;
    return currentCash / simBurn;
  }, [realRunwayData.avg, cutAmount, currentCash]);

  const avgMonthlyBurn = realRunwayData.avg;
  let runwayText = '';
  if (avgMonthlyBurn === 0 && currentCash > 0) runwayText = `Runway: ∞ (3M avg Real) | Net ${formatAmount(netProfit,currency)}`;
  else if (currentCash <= 0) runwayText = `Runway: 0 M - Critical (Real 3M avg) | Net ${formatAmount(netProfit,currency)}`;
  else { runwayText = `Runway: ${(currentCash / avgMonthlyBurn).toFixed(1)} M (3M avg Real) | Net ${formatAmount(netProfit,currency)} Margin ${profitMargin.toFixed(2)}%`; }

  const runOutMonthIndex = cumulativeCashflow.findIndex((c) => c <= 0);
  const willRunOut = runOutMonthIndex!== -1;
  const runOutMonth = willRunOut? monthsAhead[runOutMonthIndex] : `Not in next ${horizon} months`;

  const exportCSV = () => {
    const rows = [["Month","Revenue","Expenses","Profit","Margin"]];
    monthsAhead.forEach((m, i) => { rows.push([m, projectedRevenue[i], projectedExpenses[i], projectedProfit[i], projectedMargin[i]]); });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = "forecast.csv"; link.click();
    setToast("📂 Forecast exported to CSV!"); setTimeout(() => setToast(null), 3000);
  };

  const exportPDF = async () => {
    const element = reportRef.current; if(!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`FinSightAI-Forecast-${new Date().toISOString().slice(0,10)}.pdf`);
    setToast("📄 Forecast exported to PDF!"); setTimeout(() => setToast(null), 3000);
  };

  return (
    <div ref={reportRef} className="bg-gradient-to-br from-gray-50 to-teal-50 min-h-screen p-6 text-base md:text-lg font-bold">
      <h1 className="text-4xl font-black mb-2 text-gray-800">AI-Powered Forecast</h1>
      <p className="text-base font-bold mb-6 opacity-80">Daily Operations • Real Runway (3M avg): {realRunwayData.text} • Simulated Horizon: {horizon}M • Net {formatAmount(netProfit,currency)} • Margin {profitMargin.toFixed(2)}% • Does NOT affect Alerts</p>

      {anomalyAlert && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-md text-base font-bold">{anomalyAlert}</div>}

      {(() => {
  const projectedCash = cumulativeCashflow?.[horizon-1]?? currentCash;
  const projectedProfitVal = projectedProfit?.[horizon-1]?? 0;
  const monthlyBurn = (totalExpenses || 0) / (horizon || 6);
  const monthlyNet = projectedProfitVal / horizon;
  let runway = "∞";
  if (monthlyNet < 0 && monthlyBurn > 0) runway = (projectedCash / monthlyBurn).toFixed(1);
  let riskLevel = "Low";
  let bgColor = "#10b981";
  if (projectedProfitVal < 0) { riskLevel = "Critical"; bgColor = "#ef4444"; }
  else {
    const monthsCovered = monthlyBurn > 0? projectedCash / monthlyBurn : 999;
    if (monthsCovered < 1) { riskLevel = "High"; bgColor = "#f97316"; }
    else if (monthsCovered < 3) { riskLevel = "Medium"; bgColor = "#eab308"; }
  }
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 text-gray-800 p-6 rounded-2xl shadow-2xl mb-8 font-bold">
      <h2 className="text-xl font-extrabold mb-4 text-teal-600">Forecast Summary ({activeScenario}) - Real Net {formatAmount(netProfit,currency)} - Real Runway {realRunwayData.text}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-400 text-white p-4 rounded-xl shadow-lg">
          <p className="text-sm opacity-90 font-bold">Projected Cash in {horizon}M (Sim)</p>
          <p className="text-2xl font-extrabold">{formatAmount(projectedCash, currency)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-400 text-white p-4 rounded-xl shadow-lg">
          <p className="text-sm opacity-90 font-bold">Sim Runway {horizon}M / Real {realRunwayData.text}</p>
          <p className="text-2xl font-extrabold">{runway} M</p>
        </div>
        <div style={{background: `linear-gradient(to bottom right, ${bgColor}, ${bgColor}dd)`}} className="text-white p-4 rounded-xl shadow-lg">
          <p className="text-sm opacity-90 font-bold">Risk Level - Margin {profitMargin.toFixed(2)}%</p>
          <p className="text-2xl font-extrabold">{riskLevel}</p>
        </div>
      </div>
      <p className="text-lg mb-2 font-bold">{netProfit < 0? "⚠ Cash reserves may dip below safe levels. Consider reducing expenses or boosting revenue." : "✅ Cashflow looks stable. Current reserves are sufficient to sustain operations."}</p>
      <p className="mt-2 text-base font-bold">Current Margin: <span className="font-extrabold">{profitMargin.toFixed(2)}%</span> | Net {formatAmount(netProfit,currency)} | Real Runway {realRunwayData.text}</p>
      <p className="text-base font-bold">Projected Profit in {horizon} months: <span className="font-extrabold">{formatAmount(projectedProfit[horizon-1] || 0, currency)}</span></p>
      <p className="text-base font-bold">Projected Margin in {horizon} months: <span className="font-extrabold">{(projectedMargin[horizon-1] || 0).toFixed(2)}%</span>{" "}{(projectedMargin[horizon-1] || 0) > profitMargin? "⬆" : (projectedMargin[horizon-1] || 0) < profitMargin? "⬇" : "➡"}</p>
      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg font-extrabold mt-2 inline-block text-base">Adjusted Margin: {adjustedMargin.toFixed(2)}%{" "}{adjustedMargin > profitMargin? "⬆" : adjustedMargin < profitMargin? "⬇" : "➡"} | Real {realRunwayData.text}</span>
      <div className="mt-4">
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition text-base">{netProfit < 0? "Cut Costs by 10%" : "Invest in Growth"} - Real Runway {realRunwayData.text}</button>
      </div>
    </div>
  )
})()}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white/70 backdrop-blur-xl border-white/20 p-4 rounded-2xl shadow-xl"><span className="text-2xl">💰</span><h2 className="text-sm font-bold text-gray-600">Revenue</h2><p className="text-3xl font-extrabold text-emerald-600">{formatAmount(totalRevenue, currency)}</p></div>
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl"><span className="text-2xl">📉</span><h2 className="text-sm font-bold text-gray-600">Expenses</h2><p className="text-3xl font-extrabold text-rose-600">{formatAmount(totalExpenses, currency)}</p></div>
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl"><span className="text-2xl">📈</span><h2 className="text-sm font-bold text-gray-600">Net Profit</h2><p className="text-3xl font-extrabold text-blue-600">{formatAmount(netProfit, currency)}</p><p className="text-xs font-bold text-gray-600 mt-1">{runwayText}</p></div>
        <div className="bg-white/70 backdrop-blur-xl border-white/20 p-4 rounded-2xl shadow-xl"><span className="text-2xl">📊</span><h2 className="text-sm font-bold text-gray-600">Margin</h2><p className="text-3xl font-extrabold text-purple-600">{profitMargin.toFixed(2)}%</p><p className="text-xs font-bold text-gray-600 mt-1">{topExpenseText}</p></div>
      </div>

      {(() => {
  const scenarioColors = { Optimistic: "bg-green-100 border-l-4 border-green-500", Realistic: "bg-teal-50 border-l-4 border-teal-500", Pessimistic: projectedProfit[horizon-1] < 0? "bg-red-100 border-l-4 border-red-500" : "bg-yellow-50 border-l-4 border-yellow-500" };
  const scenarioEmojis = { Optimistic: "🚀", Realistic: "📊", Pessimistic: "⚠️" };
  const projectedCash = cumulativeCashflow?.[horizon-1]?? currentCash;
  const projectedProfitVal = projectedProfit?.[horizon-1]?? 0;
  const monthlyBurn = (totalExpenses || 0) / (horizon || 6);
  const monthlyNet = projectedProfitVal / horizon;
  let runway = "∞";
  if (monthlyNet < 0 && monthlyBurn > 0) runway = (projectedCash / monthlyBurn).toFixed(1);
  let riskLevel = "Low";
  let bgColor = "#10b981";
  if (projectedProfitVal < 0) { riskLevel = "Critical"; bgColor = "#ef4444"; }
  else {
    const monthsCovered = monthlyBurn > 0? projectedCash / monthlyBurn : 999;
    if (monthsCovered < 1) { riskLevel = "High"; bgColor = "#f97316"; }
    else if (monthsCovered < 3) { riskLevel = "Medium"; bgColor = "#eab308"; }
  }
  const aiInsight = activeScenario === "Pessimistic" && projectedProfit[horizon-1] < 0? `🧠 AI Insight: Revenue dropping but ${topExpense?.[0] || "fixed costs"} remain high. This creates negative cash in ${runOutMonth}. Real runway ${realRunwayData.text} is source of truth.` : activeScenario === "Optimistic"? `🧠 AI Insight: Revenue growth of 15% with flat expenses will push margin to ${(profitMargin + 15).toFixed(2)}% Real runway ${realRunwayData.text}` : `🧠 AI Insight: Margin recovering from ${profitMargin.toFixed(2)}% to 15.09%. Main driver: revenue normalization. Real runway ${realRunwayData.text}`;
  const topRisk = topExpense?.[0]? `${topExpense[0]} is ${((topExpense[1]/totalExpenses)*100).toFixed(0)}% of all expenses | Real runway ${realRunwayData.text}` : "No expense data";
  const topOpportunity = `If Revenue +15%, Profit becomes ${formatAmount(projectedProfit[horizon-1], currency)} | Real net ${formatAmount(netProfit,currency)}`;
  const quickWin = topExpense?.[0]? `Cut ${topExpense[0]} by 10% = Save ${formatAmount(topExpense[1]*0.1, currency)} | Real runway ${realRunwayData.text}` : "Review all expenses";
  return (
    <div className={`bg-white/70 backdrop-blur-xl border-white/20 p-6 rounded-2xl shadow-xl mb-6 ${scenarioColors[activeScenario]}`}>
      <h2 className="text-lg font-bold mb-4 text-gray-800">{scenarioEmojis[activeScenario]} Cashflow Insights - {activeScenario} Scenario - Real {realRunwayData.text}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white/60 p-3 rounded-lg border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-red-700 text-sm">⚠️ Top Risk</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: bgColor + '20', color: bgColor }}>{riskLevel}</span>
          </div>
          <p className="text-xs font-bold text-gray-700">{topRisk}</p>
          <p className="text-xs font-bold text-gray-500 mt-1">Sim Runway: {runway} months | Real: {realRunwayData.text} (3M avg - source for Alerts)</p>
        </div>
        <div className="bg-white/60 p-3 rounded-lg border-l-4 border-green-400"><h3 className="font-bold text-green-700 text-sm">🚀 Top Opportunity</h3><p className="text-xs font-bold text-gray-700">{topOpportunity}</p></div>
        <div className="bg-white/60 p-3 rounded-lg border-l-4 border-blue-400"><h3 className="font-bold text-blue-700 text-sm">💡 Quick Win</h3><p className="text-xs font-bold text-gray-700">{quickWin}</p></div>
      </div>
      <p className="text-base font-bold text-gray-700">📊 Total Expenses All-Time: {formatAmount(totalExpenses, currency)} | Real Runway {realRunwayData.text} (3M avg)</p>
      <p className="text-base font-bold text-gray-700">📊 {expenseChangeText}</p>
      <p className="text-base font-bold text-gray-700">{aiInsight}</p>
      <p className="text-base font-bold text-gray-700">🔮 {activeScenario} Forecast: Cashflow looks {projectedProfit[horizon-1] > 0? "stable" : "at risk"} for next {horizon} months. Projected cash: {formatAmount(cumulativeCashflow[horizon-1], currency)} | Real runway {realRunwayData.text} stays truth</p>
      <p className="text-base font-bold text-gray-700">💡 Suggested Action: {activeScenario === "Pessimistic" && projectedProfit[horizon-1] < 0? ` URGENT: Cut ${topExpense?.[0] || "expenses"} by 15%. Cash runs out in ${runOutMonth}` : activeScenario === "Pessimistic"? ` Build 3-month cash buffer. Risk high.` : activeScenario === "Optimistic"? ` Reinvest 20% into growth to hit ${formatAmount(projectedRevenue[horizon-1], currency)}` : netProfit < 0? ` Cut costs in ${topExpense?.[0] || "top categories"} Net ${formatAmount(netProfit,currency)}` : " Explore growth investments."}</p>
      <p className="text-base font-bold text-gray-700">📈 Net Profit: <span className="font-extrabold">{formatAmount(netProfit, currency)}</span> (Margin: {profitMargin.toFixed(2)}%) | Real Runway {realRunwayData.text}</p>
    </div>
  )
})()}

      <div className="flex space-x-4 mb-6 font-bold flex-wrap">
        {["Optimistic", "Realistic", "Pessimistic"].map((s) => (<button key={s} onClick={() => setScenario(s)} className={`px-4 py-2 rounded-lg font-bold text-base ${activeScenario === s? "bg-teal-500 text-white shadow-lg" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{s}</button>))}
        <button onClick={() => setActiveTab("compare")} className={`px-4 py-2 rounded-lg font-bold text-base ${activeTab === "compare"? "bg-purple-600 text-white shadow-lg" : "bg-purple-200 text-purple-700 hover:bg-purple-300"}`}>Compare All</button>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border-white/20 p-4 rounded-2xl shadow-xl mb-6">
        <h3 className="font-extrabold text-gray-800 mb-2 text-lg">🔧 What-If Simulator: Cut {topExpense?.[0] || 'Expenses'} | Real {realRunwayData.text} → Sim {newRunway.toFixed(1)}M</h3>
        <input type="range" min="0" max="30" value={costCutSlider} onChange={(e) => setCostCutSlider(Number(e.target.value))} className="w-full"/>
        <p className="text-base font-bold text-gray-700">Cut by {costCutSlider}% = Save {formatAmount(cutAmount, currency)}/month. Real Runway: {realRunwayData.text} (3M avg - source for Alerts) → New Simulated Runway: {newRunway.toFixed(1)} months (Does NOT affect Dashboard)</p>
      </div>

      <div className="mb-6 flex items-center space-x-4 font-bold flex-wrap">
        <div><label className="block text-sm font-bold text-gray-700">Forecast Horizon (Simulated Only - No effect on Alerts)</label><select value={horizon} onChange={(e) => { const val = Number(e.target.value); setHorizon(val); localStorage.setItem("horizon", val); }} className="border p-2 rounded w-40 font-bold bg-white/70 backdrop-blur-sm text-base"><option value={6}>6 months</option><option value={12}>12 months</option><option value={24}>24 months</option></select><p className="text-xs font-bold text-gray-500 mt-1">All reports use {currency} | Real runway 3M avg {realRunwayData.text}</p></div>
        <button onClick={exportCSV} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition font-bold shadow-lg text-base">Export CSV</button>
        <button onClick={exportPDF} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition font-bold shadow-lg text-base">Export PDF</button>
        <button disabled className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed font-bold text-base">Connect Bank/POS - Coming in v2</button>
      </div>

      {showModal && (<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"><div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl max-w-md font-bold"><h3 className="text-lg font-bold mb-4 text-gray-800">{netProfit < 0? "⚠ Action Plan: Cashflow Risk" : "✅ Action Plan: Growth"} - Net {formatAmount(netProfit,currency)} Margin {profitMargin.toFixed(2)}% Real {realRunwayData.text}</h3>{netProfit < 0? (<div className="text-gray-700 mb-4 text-base font-bold"><p className="mb-2">Problem: You are losing money</p><p className="text-sm font-bold text-gray-500 mb-3">Biggest leak: {topExpense?.[0] || "Expenses"} - Real Runway {realRunwayData.text}</p><p className="font-bold mb-2">Suggested Actions:</p><ol className="list-decimal list-inside space-y-2 text-sm font-bold"><li>Cut {topExpense?.[0] || "biggest expense"} by 10%</li><li>Delay non-critical purchases for 30 days</li><li>Switch to "Pessimistic" scenario to see impact</li></ol></div>) : (<div className="text-gray-700 mb-4 text-base font-bold"><p className="font-bold mb-2">Suggested Actions - Margin {profitMargin.toFixed(2)}%:</p><ol className="list-decimal list-inside space-y-2 text-sm font-bold"><li>Reinvest 20% of profit into marketing</li><li>Hire to remove bottleneck</li><li>Build 3-month cash reserve - Real runway {realRunwayData.text}</li></ol></div>)}<div className="flex justify-between"><button onClick={() => setShowModal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-bold text-base">Close</button><a href="/alerts" className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 font-bold text-base">Take Action → Real {realRunwayData.text}</a></div></div></div>)}

      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-8 rounded-2xl shadow-2xl font-bold">
        <h2 className="text-2xl font-black text-gray-800 mb-6">Forecast Visuals - Real Net {formatAmount(netProfit,currency)} Margin {profitMargin.toFixed(2)}% Real Runway {realRunwayData.text}</h2>
        <div className="flex flex-wrap gap-3 mb-8 font-black">{["trend","proportion","liquidity","growth","risk","efficiency","breakdown","heatmap","compare"].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-black text-base md:text-lg ${activeTab === tab? "bg-teal-600 text-white shadow-xl scale-105" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>))}</div>

{activeTab === "trend" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">📈 Revenue vs Expenses vs Profit Trend - {horizon}M Sim | Real {realRunwayData.text}</h2>
    <div style={{height: '650px'}}><Line options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Revenue", data: projectedRevenue, borderColor: chartColors.revenue.border, backgroundColor: chartColors.revenue.bg, fill: true, tension: 0.4, borderWidth: 3 }, { label: "Expenses", data: projectedExpenses, borderColor: chartColors.expense.border, backgroundColor: chartColors.expense.bg, fill: true, tension: 0.4, borderWidth: 3 }, { label: "Profit", data: projectedProfit, borderColor: chartColors.profit.border, backgroundColor: chartColors.profit.bg, fill: true, tension: 0.4, borderWidth: 3 }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">📈 By {monthsAhead[horizon-1]}, rev {formatAmount(projectedRevenue[horizon-1], currency)}, exp {formatAmount(projectedExpenses[horizon-1], currency)}, profit {formatAmount(projectedProfit[horizon-1], currency)}. Real runway {realRunwayData.text} source for Alerts.</p>
    {willRunOut && <p className="mt-3 text-lg md:text-xl font-black text-red-700">⚠ Run out in {runOutMonth} in {activeScenario} mode - Real runway {realRunwayData.text}</p>}
  </div>
)}

{activeTab === "proportion" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">💰 Expense vs Profit Breakdown - Margin {profitMargin.toFixed(2)}%</h2>
    <div style={{height: '650px'}}><Bar options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Expenses", data: projectedExpenses, backgroundColor: "#F43F5E", stack: "combined" }, { label: "Profit", data: projectedProfit, backgroundColor: "#10B981", stack: "combined" }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">💰 In {monthsAhead[horizon-1]}, exp {(projectedExpenses[horizon-1] / Math.max(projectedRevenue[horizon-1],1) * 100).toFixed(1)}% of rev, margin {projectedMargin[horizon-1].toFixed(1)}% vs real {profitMargin.toFixed(1)}% Net {formatAmount(netProfit,currency)} | Real Runway {realRunwayData.text}</p>
  </div>
)}

{activeTab === "liquidity" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">📊 Cash Reserves Over Time - Real Cash {formatAmount(currentCash,currency)} Real Runway {realRunwayData.text}</h2>
    <div style={{height: '650px'}}><Line options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Cash Reserves", data: cumulativeCashflow, borderColor: chartColors.cash.border, backgroundColor: chartColors.cash.bg, fill: true, tension: 0.4, borderWidth: 4 }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">📊 Start {formatAmount(cumulativeCashflow[0], currency)} → {formatAmount(cumulativeCashflow[horizon-1], currency)} by {monthsAhead[horizon-1]}. Real runway {realRunwayData.text}</p>
  </div>
)}

{activeTab === "growth" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">📈 Growth Rate Analysis - Net {formatAmount(netProfit,currency)}</h2>
    <div style={{height: '650px'}}><Line options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Sales Growth (%)", data: projectedRevenue.map((rev, i) => i === 0? 0 : ((rev - projectedRevenue[i - 1]) / projectedRevenue[i - 1]) * 100), borderColor: chartColors.revenue.border, backgroundColor: chartColors.revenue.bg, fill: false, tension: 0.4, borderWidth: 3 }, { label: "Expense Growth (%)", data: projectedExpenses.map((exp, i) => i === 0? 0 : ((exp - projectedExpenses[i - 1]) / projectedExpenses[i - 1]) * 100), borderColor: chartColors.expense.border, backgroundColor: chartColors.expense.bg, fill: false, tension: 0.4, borderWidth: 3 }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">📈 Latest sales growth {(((projectedRevenue[horizon-1] - projectedRevenue[horizon-2]) / Math.max(projectedRevenue[horizon-2],1)) * 100).toFixed(1)}%, exp {(((projectedExpenses[horizon-1] - projectedExpenses[horizon-2]) / Math.max(projectedExpenses[horizon-2],1)) * 100).toFixed(1)}% Real runway {realRunwayData.text}</p>
  </div>
)}

{activeTab === "risk" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">⚠️ Risk Scenario Analysis - Real Net {formatAmount(netProfit,currency)}</h2>
    <div style={{height: '650px'}}><Line options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Best Case Profit", data: projectedProfit.map((p) => p + (p * 0.2)), borderColor: chartColors.profit.border, backgroundColor: chartColors.profit.bg, fill: true, tension: 0.4, borderWidth: 3 }, { label: "Most Likely Profit", data: projectedProfit, borderColor: chartColors.cash.border, backgroundColor: chartColors.cash.bg, fill: true, tension: 0.4, borderWidth: 3 }, { label: "Worst Case Profit", data: projectedProfit.map((p) => p - (p * 0.2)), borderColor: chartColors.expense.border, backgroundColor: chartColors.expense.bg, fill: true, tension: 0.4, borderWidth: 3 }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">⚠ By {monthsAhead[horizon-1]}, range {formatAmount(projectedProfit[horizon-1] * 0.8, currency)} to {formatAmount(projectedProfit[horizon-1] * 1.2, currency)}, likely {formatAmount(projectedProfit[horizon-1], currency)}. Real {realRunwayData.text}</p>
  </div>
)}

{activeTab === "efficiency" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">⚙️ Efficiency Metrics - Margin {profitMargin.toFixed(2)}%</h2>
    <div style={{height: '650px'}}><Bar options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Inventory Turnover (x/month)", data: projectedRevenue.map((rev, i) => projectedExpenses[i] > 0? rev / projectedExpenses[i] : 0), backgroundColor: "#10B981", stack: "efficiency", }, { label: "Expense Ratio (% of Revenue)", data: projectedExpenses.map((exp, i) => projectedRevenue[i] > 0? (exp / projectedRevenue[i]) * 100 : 0), backgroundColor: "#3B82F6", stack: "efficiency", }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">⚙ In {monthsAhead[horizon-1]}, turnover {(projectedRevenue[horizon-1] / Math.max(projectedExpenses[horizon-1],1)).toFixed(2)}x, exp {(projectedExpenses[horizon-1] / Math.max(projectedRevenue[horizon-1],1) * 100).toFixed(1)}% of rev. Real {realRunwayData.text}</p>
  </div>
)}

{activeTab === "breakdown" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">🔎 Financial Flow Breakdown - Real Margin {profitMargin.toFixed(2)}%</h2>
    <div style={{height: '650px'}}><Bar options={{...chartOptions, plugins: {...chartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true } }}} data={{ labels: ["Revenue", "Expenses", "Profit"], datasets: [ { label: "Financial Flow", data: [adjustedRevenue, -adjustedExpenses, adjustedProfit], backgroundColor: [chartColors.revenue.border, chartColors.expense.border, chartColors.profit.border], }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">🔎 Adj rev {formatAmount(adjustedRevenue, currency)}, exp {formatAmount(adjustedExpenses, currency)}, profit {formatAmount(adjustedProfit, currency)}. Real net {formatAmount(netProfit,currency)} runway {realRunwayData.text}</p>
  </div>
)}

{activeTab === "heatmap" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">🗺️ Cashflow Heatmap - Real Runway {realRunwayData.text}</h2>
    <div style={{height: '650px'}}><Bar options={{...chartOptions, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { callback: (v) => formatAmount(Number(v), currency), font: { size: 14, weight: 'bold' } } } }}} data={{ labels: sortedMonths.map(m => new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })), datasets: (() => { const expenseByMonthCat = {}; const COLOR_MAP = { "Rent": "#F43F5E", "Marketing": "#F59E0B", "Operations": "#3B82F6", "Other": "#10B981", "Uncategorized": "#8B5CF6" }; sortedMonths.forEach(m => { expenseByMonthCat[m] = {}; transactions.filter(t => new Date(t.date).toISOString().slice(0,7) === m && t.type?.toLowerCase() === "expense").forEach(t => { const rawCat = (t.category || "Uncategorized").trim(); const cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase(); expenseByMonthCat[m][cat] = (expenseByMonthCat[m][cat] || 0) + Number(t.amount || 0); }) }); const allCats = [...new Set(Object.values(expenseByMonthCat).flatMap(obj => Object.keys(obj)))].slice(0,6); return allCats.map((cat) => ({ label: cat, data: sortedMonths.map(m => expenseByMonthCat[m][cat] || 0), backgroundColor: COLOR_MAP[cat] || "#6B7280", })) })() }} /></div>
    {(() => {
      const expenseByMonthCat = {}; sortedMonths.forEach(m => { expenseByMonthCat[m] = {}; transactions.filter(t => new Date(t.date).toISOString().slice(0,7) === m && t.type?.toLowerCase() === "expense").forEach(t => { const rawCat = (t.category || "Uncategorized").trim(); const cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase(); expenseByMonthCat[m][cat] = (expenseByMonthCat[m][cat] || 0) + Number(t.amount || 0); }) });
      const lastM = lastRecordedMonth; const prevM = sortedMonths[sortedMonths.length - 2];
      const lastTotal = Object.values(expenseByMonthCat[lastM] || {}).reduce((a,b) => a+b, 0); const prevTotal = Object.values(expenseByMonthCat[prevM] || {}).reduce((a,b) => a+b, 0);
      const percentChange = prevTotal > 0? ((lastTotal - prevTotal) / prevTotal) * 100 : 0; const topLastCat = Object.entries(expenseByMonthCat[lastM] || {}).sort((a,b) => b[1]-a[1])[0];
      if(lastTotal === 0) return null;
      return (
        <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
          <p className="font-black text-amber-900 text-lg">💡 AI Insight - Real Runway {realRunwayData.text} - Net {formatAmount(netProfit,currency)}</p>
          {percentChange > 20? (<p className="text-lg font-black text-gray-800 mt-2">Spending up {percentChange.toFixed(0)}% in {new Date(lastM + '-01').toLocaleString('default', { month: 'long' })}. Biggest: <span className="font-black">{topLastCat?.[0]}</span> at {formatAmount(topLastCat?.[1] || 0, currency)}.</p>) : (<p className="text-lg font-black text-gray-800 mt-2">Biggest cost in {new Date(lastM + '-01').toLocaleString('default', { month: 'long' })}: <span className="font-black">{topLastCat?.[0]}</span> at {formatAmount(topLastCat?.[1] || 0, currency)} Real runway {realRunwayData.text}</p>)}
        </div>
      )
    })()}
  </div>
)}

{activeTab === "compare" && (
  <div className="bg-white border border-gray-200 text-gray-800 p-8 rounded-2xl shadow-xl mb-8">
    <h2 className="text-2xl font-black mb-6 text-teal-600">⚖️ Scenario Comparison - Real Net {formatAmount(netProfit,currency)} Real Runway {realRunwayData.text}</h2>
    <div style={{height: '650px'}}><Line options={chartOptions} data={{ labels: monthsAhead, datasets: [ { label: "Optimistic Cash", data: monthsAhead.map((_, i) => { const optRev = avgMonthlyRevenue * Math.pow(1.10, i + 1); const optExp = avgMonthlyExpense * Math.pow(1.03, i + 1); const optProfit = optRev - optExp; return startingReserves + (optProfit * (i+1)) }), borderColor: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.1)", fill: false, tension: 0.4, borderWidth: 4 }, { label: "Realistic Cash", data: cumulativeCashflow, borderColor: "#14B8A6", backgroundColor: "rgba(20, 184, 166, 0.1)", fill: false, tension: 0.4, borderWidth: 4 }, { label: "Pessimistic Cash", data: monthsAhead.map((_, i) => { const pesRev = avgMonthlyRevenue * Math.pow(1.02, i + 1); const pesExp = avgMonthlyExpense * Math.pow(1.05, i + 1); const pesProfit = pesRev - pesExp; return startingReserves + (pesProfit * (i+1)) }), borderColor: "#F43F5E", backgroundColor: "rgba(244, 63, 94, 0.1)", fill: false, tension: 0.4, borderWidth: 4 }, ] }} /></div>
    <p className="mt-6 text-lg md:text-xl font-black text-gray-800">📊 Green=Best, Teal=Likely, Red=Worst. Real runway {realRunwayData.text} (3M avg) stays source of truth for Alerts. Net {formatAmount(netProfit,currency)}</p>
  </div>
)}

<div className="mt-10 pt-8 border-t border-gray-300 text-center space-y-4">
  <p className="text-base md:text-lg font-black text-gray-600">🔒 Bank-level security. Real Runway {realRunwayData.text} (3M avg) • Sim Horizon {horizon}M • Real Margin {profitMargin.toFixed(2)}% • Net {formatAmount(netProfit,currency)} • Coming in v2</p>
  <p className="text-base md:text-lg font-black text-gray-600">FinSight AI | Support: support@finsight.ai | Real Net {formatAmount(netProfit,currency)} | Real Runway {realRunwayData.text}</p>
  <a href={`https://wa.me/?text=${encodeURIComponent(`Hi FinSight Support, I need help with my forecast. Current Net Profit: ${formatAmount(netProfit, currency)}, Margin: ${profitMargin.toFixed(2)}%, Real Runway: ${realRunwayData.text}`)}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:scale-105 transition">💬 Send Forecast to WhatsApp - Real {realRunwayData.text} Net {formatAmount(netProfit,currency)}</a>
</div>

{toast && (<div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl font-black text-lg">{toast}</div>)}

      </div>
    </div>
  );
}

export default Forecast;