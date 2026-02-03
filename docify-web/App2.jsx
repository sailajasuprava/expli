function App() {
  return (
    /* The teal container matches your wireframe's background */
    <div className="w-[350px] bg-[#008080] p-6 flex flex-col items-center shadow-xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-white text-3xl font-bold tracking-tight">
          Docify Web
        </h1>
      </header>

      {/* Button Group */}
      <main className="w-full flex flex-col gap-3">
        <button className="w-full bg-[#121212] hover:bg-black text-white py-3 px-4 rounded-full font-semibold text-lg transition-colors border-none shadow-md">
          Capture Entire Page
        </button>

        <button className="w-full bg-[#121212] hover:bg-black text-white py-3 px-4 rounded-full font-semibold text-lg transition-colors border-none shadow-md">
          Select Page Section
        </button>

        <button className="w-full bg-[#121212] hover:bg-black text-white py-3 px-4 rounded-full font-semibold text-lg transition-colors border-none shadow-md">
          Reader Mode PDF
        </button>

        {/* Separated Button (LINK TO PDF) */}
        <button className="w-full mt-2 bg-[#121212] hover:bg-black text-white border-2 border-[#121212] py-3 px-4 rounded-full font-bold text-lg transition-all tracking-widest uppercase">
          Link to PDF
        </button>
      </main>

      {/* Small footer if needed, matching the wireframe's minimalist style */}
      <footer className="mt-4 text-xs text-white/70">v1.0.0</footer>
    </div>
  );
}

export default App;
