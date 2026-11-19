import { LayoutDashboard, Users, MapPin, ShoppingBasket, BookOpen, RefreshCw, Settings, Bot, Bell, Search, ChevronDown, Calendar, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

// Mock Data
const stats = [
  { label: 'Posyandu & RW Aktif', value: '8', sub: 'Tersebar di 4 Dusun', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Kader & Bidan Terdaftar', value: '26', sub: '24 Kader, 2 Bidan Desa', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Komoditas Pangan Lokal', value: '42', sub: 'Harga Terverifikasi Minggu Ini', color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Dokumen Pedoman AI', value: '12', sub: 'Status Vector Index: Optimal', color: 'text-orange-600', bg: 'bg-orange-50' },
];

const posyanduStatus = [
  { name: 'Posyandu Melati 1', rw: 'RW 01', status: 'Tersinkron' },
  { name: 'Posyandu Mawar', rw: 'RW 02', status: 'Tersinkron' },
  { name: 'Posyandu Kenanga', rw: 'RW 03', status: 'Menunggu' },
];

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-[#F5F7FB] text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F3D4C] text-white flex flex-col">
        <div className="p-6 text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0F9D8A] rounded-lg" /> SigapGizi
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Master Wilayah', icon: MapPin },
            { name: 'Manajemen Akun', icon: Users },
            { name: 'Harga Pangan Lokal', icon: ShoppingBasket },
            { name: 'Knowledge Base', icon: BookOpen },
            { name: 'Log Sinkronisasi', icon: RefreshCw },
            { name: 'Pengaturan Desa', icon: Settings },
          ].map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${i === 0 ? 'bg-[#2597d0]' : 'hover:bg-[#1a5b6f]'}`}>
              <item.icon size={20} /> {item.name}
            </button>
          ))}
        </nav>
        <div className="p-4">
          <div className="bg-[#1a5b6f] p-4 rounded-xl text-center">
            <Bot className="mx-auto mb-2 text-[#0F9D8A]" />
            <p className="text-sm">Asisten AI SigapGizi</p>
            <button className="mt-3 w-full bg-[#0F9D8A] py-2 rounded-lg text-sm">Uji RAG & AI</button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" placeholder="Cari posyandu, kader, atau dokumen..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2"><Bell size={20} /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></button>
            <div className="flex items-center gap-2 font-medium">Admin Desa <ChevronDown size={16} /></div>
          </div>
        </header>

        {/* Hero */}
        <section className="flex gap-6 mb-8">
          <div className="flex-1 bg-gradient-to-r from-[#17467a] to-[#2597d0] p-8 rounded-2xl text-white">
            <h1 className="text-2xl font-bold mb-2">Selamat Pagi, Admin Desa!</h1>
            <p className="opacity-90 max-w-lg mb-6">Kelola master data Posyandu, daftar harga pangan lokal, serta basis pengetahuan AI Nutri-Chef untuk mendukung pencegahan stunting desa.</p>
            <button className="bg-white text-[#17467a] px-6 py-2 rounded-xl font-semibold">Kelola Knowledge Base</button>
          </div>
          <div className="w-80 space-y-4">
            <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
              <div><p className="text-xs text-gray-500">Knowledge Base RAG</p><p className="font-bold">12 Dokumen</p></div>
              <button className="text-[#0F9D8A] text-sm font-semibold">Unggah</button>
            </div>
            <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
              <div><p className="text-xs text-gray-500">Harga Pangan Desa</p><p className="font-bold">Update Terakhir</p></div>
              <button className="text-[#0F9D8A] text-sm font-semibold">Update</button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-500">{s.label}</p>
              <h3 className="text-3xl font-bold mt-1">{s.value}</h3>
              <p className={`text-xs ${s.color} mt-1`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Middle Content */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border">
            <h3 className="font-semibold mb-4">Status Posyandu & Partisipasi</h3>
            {posyanduStatus.map((p, i) => (
              <div key={i} className="flex justify-between py-3 border-b last:border-0">
                <span>{p.name} ({p.rw})</span>
                <span className={`px-2 py-1 rounded text-xs ${p.status === 'Tersinkron' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-2xl border">
            <h3 className="font-semibold mb-4">Pembaruan Harga Pangan</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span>Telur Ayam Kampung</span><span className="font-semibold">Rp 2.500</span></div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span>Ikan Lele Segar</span><span className="font-semibold">Rp 24.000</span></div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-gray-100 p-6">
        <h3 className="font-semibold mb-4">Kalender & Agenda</h3>
        <div className="bg-gray-50 p-4 rounded-xl mb-6">Kalender interaktif di sini...</div>
        <h3 className="font-semibold mb-4">Pengingat Penting</h3>
        <div className="space-y-3">
          <div className="p-4 border rounded-xl bg-blue-50 border-blue-100">
            <p className="text-sm font-medium">Batas akhir rekap laporan Dinkes</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
