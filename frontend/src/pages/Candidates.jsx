import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardBody } from "../components/ui/Card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        // Use the new endpoint we added to list sessions as a proxy for candidates
        const res = await axios.get("http://localhost:8000/monitoring/sessions/list");
        setCandidates(res.data);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const chartData = {
    labels: candidates.map(c => c.candidate_email.split('@')[0]),
    datasets: [
      {
        label: 'Integrity Score',
        data: candidates.map(c => c.integrity_score),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Candidate Integrity Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Candidate Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare candidate performance and integrity across all sessions.
        </p>
      </div>

      {candidates.length > 0 && (
        <Card className="mb-10">
          <CardHeader>
            <h2 className="text-lg font-bold text-slate-800">Score Distribution</h2>
          </CardHeader>
          <CardBody>
            <div className="h-[300px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))
        ) : candidates.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic">
            No candidates have completed interviews yet.
          </div>
        ) : (
          candidates.map((candidate, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {candidate.candidate_email}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {candidate.session_id.slice(0, 8)}
                    </div>
                  </div>
                  <div className={`text-xs font-black px-2 py-1 rounded ${
                    candidate.integrity_score > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {candidate.integrity_score.toFixed(0)}%
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-wider">
                      <span>Integrity Progress</span>
                      <span>{candidate.integrity_score.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          candidate.integrity_score > 80 ? 'bg-emerald-500' : 
                          candidate.integrity_score > 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${candidate.integrity_score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[12px]">calendar_today</span>
                      {new Date(candidate.start_time).toLocaleDateString()}
                    </span>
                    <span className={`flex items-center gap-1 ${candidate.mobile_connected ? 'text-green-500' : 'text-slate-300'}`}>
                      <span className="material-icons text-[12px]">smartphone</span>
                      {candidate.mobile_connected ? 'Verified' : 'Desktop only'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default Candidates;
