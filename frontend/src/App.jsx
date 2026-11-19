import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 sm:p-12">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
            🌱
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Tumbuhin</h1>
            <p className="text-xs text-slate-400">React + Tailwind CSS + Golang MVC</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            ● Frontend Ready
          </span>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-5xl mx-auto w-full py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-6">
          <span>✨ Fullstack Monorepo Architecture</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Modern Web Stack with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">React & Golang</span>
        </h2>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl">
          Frontend dibangun menggunakan Vite, React 19, dan Tailwind CSS. Backend dirancang dengan Golang arsitektur MVC Clean Code.
        </p>

        {/* Interactive Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-6 py-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Counter: {count}
          </button>
          <a
            href="http://localhost:8080/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            Test Go API Endpoint →
          </a>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-emerald-500/40 transition-colors">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white">Vite & React</h3>
            <p className="mt-2 text-sm text-slate-400">
              Pengembangan super cepat dengan Hot Module Replacement (HMR) dan React functional components.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-emerald-500/40 transition-colors">
            <div className="text-2xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-white">Tailwind CSS</h3>
            <p className="mt-2 text-sm text-slate-400">
              Utility-first CSS styling modern, responsive, dan hemat ukuran bundle tanpa konfigurasi ribet.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-emerald-500/40 transition-colors">
            <div className="text-2xl mb-3">🏛️</div>
            <h3 className="text-lg font-semibold text-white">Golang MVC Clean Code</h3>
            <p className="mt-2 text-sm text-slate-400">
              Pemisahan tanggung jawab terstruktur: Model, View/Response DTO, Controller, Service, dan Repository.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        Tumbuhin Project &copy; {new Date().getFullYear()} — Siap untuk tahap pengembangan selanjutnya.
      </footer>
    </div>
  )
}
