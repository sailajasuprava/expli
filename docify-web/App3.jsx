import { FileText, MousePointerClick, BookOpen, Link } from "lucide-react";

function App() {
  return (
    <div className="w-[380px] bg-gradient-to-br from-[#008080] to-[#006666] p-8 flex flex-col items-center shadow-2xl min-h-[500px]">
      {/* Header with subtle animation */}
      <header className="mb-8 text-center">
        <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl mb-2 border border-white/20">
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Docify Web
          </h1>
        </div>
        <p className="text-white/80 text-sm mt-2 font-light">
          Capture & Convert Web Pages
        </p>
      </header>

      {/* Button Group with modern card-like appearance */}
      <main className="w-full flex flex-col gap-3">
        <button className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-white py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-300 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
          <span>Capture Entire Page</span>
          <svg
            className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>

        <button className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-white py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-300 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
          <span>Select Page Section</span>
          <svg
            className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </button>

        <button className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-white py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-300 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
          <span>Reader Mode PDF</span>
          <svg
            className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </button>

        {/* Highlighted Primary Action */}
        <div className="mt-3 relative">
          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md"></div>
          <button className="group relative w-full bg-white hover:bg-gray-50 text-[#008080] py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>Link to PDF</span>
          </button>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-auto pt-6 flex items-center gap-4 text-white/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">Ready</span>
        </div>
        <span className="text-xs">•</span>
        <span className="text-xs font-light">v1.0.0</span>
      </footer>
    </div>
  );
}

export default App;
