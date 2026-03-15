
import React from 'react';

const Leaderboard = ({ candidates }) => {
  // Sort candidates by average score descending
  const sortedCandidates = [...candidates].sort((a, b) => b.average_score - a.average_score);

  return (
    <div className="lg:col-span-12">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Top Candidates</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time performance ranking based on AI evaluation.</p>
          </div>
          <div className="flex gap-2">
             <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full ring-1 ring-emerald-200">
               {candidates.length} Total
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-4 pt-0 px-4">Rank</th>
                <th className="pb-4 pt-0 px-4">Candidate</th>
                <th className="pb-4 pt-0 px-4 text-center">Score</th>
                <th className="pb-4 pt-0 px-4 text-center">Time</th>
                <th className="pb-4 pt-0 px-4 text-center">Integrity</th>
                <th className="pb-4 pt-0 px-4 text-center">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedCandidates.map((candidate, index) => (
                <tr key={candidate.candidate_id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' :
                      index === 1 ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' :
                      index === 2 ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' :
                      'text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs ring-1 ring-slate-200">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="font-semibold text-slate-900">{candidate.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-sm">
                      {candidate.average_score}/10
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm text-slate-600 font-medium">{Math.round(candidate.total_time / 60)}m</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${candidate.average_integrity > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${candidate.average_integrity}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{Math.round(candidate.average_integrity)}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm text-slate-600 font-medium">{candidate.attempts}</span>
                  </td>
                </tr>
              ))}
              {sortedCandidates.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-slate-500 italic">
                    No evaluation data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

