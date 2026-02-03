import { FileText, MousePointerClick, BookOpen, Link } from "lucide-react";

function App() {
  return (
    <div className="w-[380px] bg-gradient-to-br from-[#008080] to-[#006666] p-8 flex flex-col items-center shadow-2xl">
      {/* Header with subtle animation */}
      <header className="mb-8 text-center">
        <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl mb-2 border border-white/20">
          <h1 className="text-white text-4xl font-bold tracking-tight">
            Docify Web
          </h1>
        </div>
        <p className="text-white/80 text-sm mt-2 font-light">
          Capture & Convert Web Pages
        </p>
      </header>

      {/* Button Group with modern card-like appearance */}
      <main className="w-full flex flex-col gap-3">
        <button className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-white py-2 px-4 rounded-md font-semibold text-xs transition-all! duration-300! border-none shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
          <span>Capture Entire Page</span>
          <FileText className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all!" />
        </button>
        <button className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-white py-2 px-4 rounded-md font-semibold text-xs transition-all! duration-300! border-none shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
          <span>Select Page Section</span>
          <MousePointerClick className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all!" />
        </button>
        <button className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-white py-2 px-4 rounded-md font-semibold text-xs transition-all! duration-300! border-none shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
          <span>Reader Mode PDF</span>
          <BookOpen className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all!" />
        </button>

        {/* Highlighted Primary Action */}
        <div className="mt-3 relative">
          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md"></div>
          <button className="group relative w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] hover:from-[#252525] hover:to-[#1a1a1a] text-[#05cbcb] py-2 px-4 rounded-md font-bold text-xs transition-all! duration-300! shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide">
            <Link className="w-5 h-5" />
            <span>Link to PDF</span>
          </button>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-4 text-xs text-white/70">v1.0.0</footer>
    </div>
  );
}

export default App;
