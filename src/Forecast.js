import React, { useState, useEffect } from "react";

function ForecastSection() {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/forecast")
      .then(res => res.json())
      .then(data => setForecast(data))
      .catch(err => console.error("Forecast error:", err));
  }, []);

  if (!forecast) return <p>Loading forecast...</p>;

  return (
    <div>
      <h2>Forecast</h2>
      <p>Current Net Cashflow: ${forecast.current_net}</p>
      <p>Predicted Next Net Cashflow: ${forecast.forecast_next}</p>
    </div>
  );
}

export default ForecastSection;
