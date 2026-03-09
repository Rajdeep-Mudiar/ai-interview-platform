function Navbar() {
  return (
    <div className="flex justify-between p-6 bg-gray-800 text-white">
      <h2 className="font-bold">AI Hire</h2>

      <div className="space-x-6">
        <a href="/">Home</a>

        <a href="/voice-interview">Interview</a>

        <a href="/dashboard">Dashboard</a>
      </div>
    </div>
  );
}

export default Navbar;
