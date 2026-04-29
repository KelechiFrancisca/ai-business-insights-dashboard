import React from "react";

function InsightsPanel({ transactions }) {
  const totalRevenue = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const expenseTrend = totalExpenses > 4000 ? "high" : "normal";
  const forecast = netProfit < 2000 ? 
    "Cash reserves may drop below safe levels in 45 days." : 
    "Cashflow looks stable for the next 2 months.";

  const suggestion = expenseTrend === "high" ? 
    "Consider renegotiating supplier contracts or cutting non‑essential costs." : 
    "Maintain current expense levels to keep profit steady.";

  return (
    <div className="bg-yellow-50 p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-bold mb-4">Cashflow Insights</h2>
      <ul className="space-y-2 text-gray-800">
        <li>📊 Expenses are currently {expenseTrend} compared to typical levels.</li>
        <li>🔮 Forecast: {forecast}</li>
        <li>💡 Suggested Action: {suggestion}</li>
        <li>📈 Net Profit: ${netProfit.toFixed(2)}</li>
      </ul>
    </div>
  );
}

export default InsightsPanel;
