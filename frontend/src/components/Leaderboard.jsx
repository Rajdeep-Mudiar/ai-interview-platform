import React from "react";
import { Card, CardBody, CardHeader } from "./ui/Card";

export default function Leaderboard({ candidates = [] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Top Performers
            </div>
            <div className="text-sm text-slate-600">
              Highest scoring candidates in the platform.
            </div>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200">
            Global Rankings
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-200">Rank</th>
                <th className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-200">Candidate</th>
                <th className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-200 text-center">Score</th>
                <th className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-200 text-center">Proctoring</th>
                <th className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-200 text-right">Integrity</th>
                <th className="px-6 py-3 font-semibold text-slate-900 border-b border-slate-200 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.length > 0 ? (
                candidates.map((candidate, index) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 border-b border-slate-100">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        index === 0 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" :
                        index === 1 ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300" :
                        index === 2 ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200" :
                        "bg-white text-slate-500 ring-1 ring-slate-200"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <div className="font-medium text-slate-900">{candidate.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{candidate.job_title}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <span className="font-bold text-slate-900">{candidate.overall_score}%</span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        candidate.proctoring_score >= 90 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                        candidate.proctoring_score >= 70 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}>
                        {candidate.proctoring_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-right">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        candidate.integrity_score >= 90 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                        candidate.integrity_score >= 75 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                        "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      }`}>
                        {candidate.integrity_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-right">
                      {candidate.report_file ? (
                        <a
                          href={`http://127.0.0.1:8000/reports/download/${candidate.report_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-700 underline"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    No candidates found in the leaderboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
