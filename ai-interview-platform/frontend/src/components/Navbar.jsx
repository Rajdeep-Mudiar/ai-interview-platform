import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex justify-between">
      <h2 className="font-bold">AI Hiring</h2>
      <div className="flex gap-6">
        <Link to="/">Home</Link>
        <Link to="/resume">Resume Analyzer</Link>
        <Link to="/interview">AI Interview</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>
    </nav>
  );
}
