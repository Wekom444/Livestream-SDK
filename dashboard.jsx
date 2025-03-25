import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const [config, setConfig] = useState({});
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await axios.get("/dashboard");
        setConfig(res.data.config);
      } catch (error) {
        console.error("Error fetching dashboard config:", error);
      }
    }
    async function fetchAnalytics() {
      try {
        const res = await axios.get("https://your-api.com/analytics", {
          headers: { Authorization: "Bearer YOUR_VENDOR_JWT_TOKEN" }
        });
        setAnalytics(res.data.logs || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    }
    fetchDashboard();
    fetchAnalytics();
  }, []);

  return (
    <div style={{ background: config.theme === "glovo-dark" ? "#222" : "#fff", color: config.theme === "glovo-dark" ? "#fff" : "#000", padding: "20px" }}>
      <h2>Vendor Dashboard</h2>
      <h3>Configuration</h3>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      <h3>Analytics</h3>
      <ul>
        {analytics.map((item, idx) => (
          <li key={idx}>
            {new Date(item.timestamp * 1000).toLocaleString()}: {item.search_term} → {JSON.stringify(item.results)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
