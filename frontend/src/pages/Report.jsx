function Report() {
  return (
    <div className="cb-container py-10 sm:py-14">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Report
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Generated reports will be available here.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="text-sm text-slate-600">
          This page is a placeholder. Once backend report generation is wired,
          we can list downloadable artifacts with filters and search.
        </div>
      </div>
    </div>
  );
}

export default Report;
