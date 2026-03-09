import React, { useEffect, useState } from "react";
import axios from "axios";

function RecruiterDashboard() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/alerts").then((res) => {
      setAlerts(res.data);
    });
  }, []);

  return (
    <div>
      <h1>Recruiter Dashboard</h1>

      {alerts.map((alert, i) => (
        <p key={i}>{alert.message}</p>
      ))}
    </div>
  );
}

export default RecruiterDashboard;
