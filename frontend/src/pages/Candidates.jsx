function Candidates() {
  return (
    <div className="cb-container py-10 sm:py-14">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Candidate results
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Reviewed candidates and interview outcomes will appear here.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <div className="text-sm font-semibold text-slate-900">
              Candidate {i + 1}
            </div>
            <div className="mt-2 grid gap-1 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Score</span>
                <span className="font-medium text-slate-900">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Recommendation</span>
                <span className="font-medium text-slate-900">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Integrity</span>
                <span className="font-medium text-slate-900">—</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Candidates;
