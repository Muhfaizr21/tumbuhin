import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { BRAND_INFO } from '../../constants/landingData'
import { LettersStethoscopeIcon } from '../ui/LettersIcons'
import { registerWithBackend } from '../../lib/authApi'
import { isMockEnabled, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function AuthPage({ initialMode = 'login', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'register'
  const [loginMethod, setLoginMethod] = useState('phone') // 'phone' | 'email'

  // Form states pre-populated with seeded Kader account for instant testing
  const [phone, setPhone] = useState('081288990011')
  const [email, setEmail] = useState('kader@tumbuhin.id')
  const [password, setPassword] = useState('kadersehat2026')
  const [name, setName] = useState('')
  const [role, setRole] = useState('kader')
  const [posyanduName, setPosyanduName] = useState('Posyandu Melati 04')
  const [agreed, setAgreed] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agreed) {
      setSubmittedMessage({
        type: 'error',
        title: 'Persetujuan Diperlukan',
        desc: 'Harap setujui Ketentuan Layanan & Kebijakan Privasi Data Medis.',
      })
      return
    }

    setSubmittedMessage(null)
    setIsLoading(true)

    try {
      if (mode === 'login') {
        const identifier = loginMethod === 'phone' ? phone.trim() : email.trim()
        const result = await login({
          identifier,
          email: email.trim(),
          phone: phone.trim(),
          password,
        })
        
        if (!result.success) throw new Error(result.error)

        setSubmittedMessage({
          type: 'success',
          title: 'Autentikasi Berhasil',
          desc: `Mengarahkan ke Dasbor Role...`,
        })

        if (onAuthSuccess) {
          onAuthSuccess({ user: result.user, redirect_to: result.redirect_to })
        }
        return
      } else {
        // Registration still uses direct backend call
        const authData = await registerWithBackend({
          fullName: name.trim() || 'Petugas Posyandu',
          email: email.trim(),
          phone: phone.trim(),
          password,
          role,
          posyanduName: posyanduName.trim() || 'Posyandu Melati 04',
        })

        setSubmittedMessage({
          type: 'success',
          title: 'Registrasi Berhasil',
          desc: `Akun ${authData.user.full_name} terdaftar sebagai ${authData.user.role.toUpperCase()}. Mengarahkan ke dasbor...`,
        })

        if (onAuthSuccess) {
          onAuthSuccess(authData)
        }
        return
      }
    } catch (backendErr) {
      setSubmittedMessage({
        type: 'error',
        title: mode === 'login' ? 'Autentikasi Gagal' : 'Registrasi Gagal',
        desc: backendErr?.message || 'Periksa kembali kredensial atau pastikan server backend Go berjalan di port 8080.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh w-full bg-linear-to-br from-[#eef5fc] via-[#dcebf9] to-[#c5ddf5] text-[#070709] flex flex-col justify-between overflow-x-hidden selection:bg-[#2597d0] selection:text-white">
      {/* Dynamic 3D Silk Wave Backdrop (Mirroring Reference Image) */}
      <div
        className="pointer-events-none fixed inset-0 bg-linear-to-br from-[#eef5fc] via-[#dcebf9] to-[#bfd9f5] overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-36 -left-32 w-[680px] h-[680px] rounded-full bg-linear-to-tr from-[#ffffff]/80 via-[#d8eaf8]/60 to-transparent blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-linear-to-br from-[#779bc1]/25 via-[#2597d0]/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 left-0 right-0 h-[420px] bg-linear-to-t from-[#8bb3dc]/35 via-[#b5d2ee]/25 to-transparent blur-2xl" />

        {/* Flowing 3D Ribbon Wave SVG */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[460px] object-cover"
          viewBox="0 0 1440 460"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-60,340 C220,410 440,180 780,220 C1120,260 1260,130 1500,150 L1500,460 L-60,460 Z"
            fill="url(#wave-ribbon-1)"
          />
          <path
            d="M-60,390 C300,260 580,370 940,240 C1200,150 1350,210 1500,190 L1500,460 L-60,460 Z"
            fill="url(#wave-ribbon-2)"
          />
          <path
            d="M-40,350 C240,400 460,175 790,218 C1130,260 1270,128 1500,148"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="2.5"
            fill="none"
          />
          <defs>
            <linearGradient id="wave-ribbon-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#89aee0" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#9ec2ec" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="wave-ribbon-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6c96d4" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#b9d5f4" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#e7f1fc" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header Navigation: Brand & Back to Home */}
      <nav className="relative z-30 w-full max-w-[1320px] mx-auto px-6 sm:px-10 pt-6 pb-2 flex items-center justify-between">
        <a
          href="#top"
          onClick={onClose}
          className="inline-flex items-center gap-2.5 min-h-[44px] group"
        >
          <span className="w-9 h-9 rounded-xl bg-[#2597d0] shadow-[0_6px_16px_rgba(37,151,208,0.3)] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <LettersStethoscopeIcon className="w-5 h-5 text-white" />
          </span>
          <span className="font-runde font-bold text-[21px] tracking-[-0.03em] text-[#0b1f3a]">
            {BRAND_INFO.name}
          </span>
        </a>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/75 hover:bg-white backdrop-blur-md border border-white/80 text-[13.5px] font-runde font-medium text-[#0b1f3a] transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </nav>

      {/* Main Content Split: Full Doctor Cutout on Left Background + Floating Form Card on Right */}
      <main className="relative z-20 w-full max-w-[1320px] mx-auto px-6 sm:px-10 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Column: Full-Scale Doctor Cutout Integrated Directly with Background + Floating AI Bubbles */}
          <div className="lg:col-span-7 relative flex flex-col lg:flex-row items-center lg:items-end justify-between min-h-[480px] sm:min-h-[560px] pt-4">
            {/* Left Brand Typography & Floating Dialogue Bubbles (Like Reference 'THE NOVOS FUTURE') */}
            <div className="relative z-20 flex flex-col items-start max-w-[360px] lg:mb-16">
              <span className="font-inter text-[11px] font-bold tracking-[0.22em] uppercase text-[#4a729e] mb-1">
                THE SMART POSYANDU
              </span>
              <h1 className="font-runde font-bold text-[44px] sm:text-[56px] leading-[0.95] tracking-[-0.04em] bg-linear-to-r from-[#09203f] via-[#17467a] to-[#2597d0] bg-clip-text text-transparent">
                tumbuhin
              </h1>
              <span className="mt-1.5 font-inter text-[11px] font-semibold tracking-[0.18em] uppercase text-[#5c7ea6]">
                CLINICAL AI ECOSYSTEM
              </span>

              <p className="mt-4 font-runde text-[14.5px] text-[#3b526e] leading-[1.5]">
                Sistem informasi Posyandu & deteksi dini stunting berbasis standar
                antropometri WHO LMS dan RAG Kemenkes RI.
              </p>

              {/* Cascading Floating Speech Bubbles (Direct match to reference image) */}
              <div className="mt-6 flex flex-col items-start gap-2.5">
                <div className="px-3.5 py-1.5 rounded-full bg-white/55 backdrop-blur-md border border-white/70 text-[12px] font-runde text-[#4a6585] shadow-2xs">
                  Halo Petugas Posyandu & Bidan Desa,
                </div>
                <div className="px-4 py-2 rounded-full bg-white/75 backdrop-blur-md border border-white/80 text-[12.5px] font-runde text-[#1e3a5f] shadow-xs">
                  Kalkulasi Z-Score balita siap diproses otomatis.
                </div>
                <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white text-[13px] font-runde font-medium text-[#0b1f3a] shadow-sm">
                  Silakan verifikasi identitas petugas terlebih dahulu.
                </div>
              </div>
            </div>

            {/* Full-Scale Cutout Doctor Standing Directly Against the Background (NO BOX!) */}
            <div className="relative z-10 mt-6 lg:mt-0 lg:-ml-12 flex flex-col items-center justify-end select-none">
              {/* Soft Halo Glow Behind the Doctor */}
              <div
                className="pointer-events-none absolute top-6 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full bg-white/65 blur-3xl"
                aria-hidden="true"
              />

              <img
                src="/doctor-auth-cutout.png"
                alt="dr. Anindya Putri, Sp.A - Konsultan Nutrisi Pediatrik Tumbuhin"
                width={896}
                height={1200}
                fetchPriority="high"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 80%, transparent 99%)',
                  maskImage:
                    'linear-gradient(to bottom, black 80%, transparent 99%)',
                }}
                className="relative z-10 w-[300px] sm:w-[370px] lg:w-[430px] xl:w-[450px] h-auto object-contain drop-shadow-[0_20px_36px_rgba(16,55,132,0.16)]"
              />

              {/* Subtle Floating Badge */}
              <div className="relative z-20 -mt-14 sm:-mt-16 px-4 py-2 rounded-full bg-white/75 backdrop-blur-md border border-white/90 shadow-[0_8px_24px_rgba(16,55,132,0.10)] flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <span className="font-runde font-semibold text-[13px] text-[#0b1f3a]">
                  dr. Anindya Putri, Sp.A
                </span>
                <span className="text-[#8b8b8b] text-[12px]">|</span>
                <span className="font-inter text-[11.5px] text-[#4a6585]">
                  Konsultan Nutrisi Anak
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating White Auth Card (100% Matching Reference Layout) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full py-4">
            <div className="w-full max-w-[430px] rounded-[24px] bg-white/95 backdrop-blur-xl p-8 sm:p-9 shadow-[0_24px_64px_rgba(25,90,165,0.12)] border border-white">
              {/* Card Title */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-runde font-bold text-[22px] tracking-[-0.02em] text-[#070709]">
                    {mode === 'login'
                      ? 'Masuk Akun Tumbuhin'
                      : 'Registrasi Petugas Posyandu'}
                  </h2>
                  <p className="font-runde text-[13px] text-[#60606c] mt-1">
                    {mode === 'login'
                      ? 'Akses dasbor antropometri & buku KIA digital'
                      : 'Daftarkan unit Posyandu untuk sinkronisasi Puskesmas'}
                  </p>
                </div>
                {!isMockEnabled && isSupabaseConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Demo Mock
                  </span>
                )}
              </div>

              {/* Method Tabs (Phone vs Email) matching reference tabs */}
              {mode === 'login' && (
                <div className="mt-6 flex items-center gap-7 border-b border-black/8 text-[14px] font-runde font-medium">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={`pb-2.5 transition-colors relative cursor-pointer ${loginMethod === 'phone'
                        ? 'text-[#070709] font-semibold'
                        : 'text-[#8b8b8b] hover:text-[#070709]'
                      }`}
                  >
                    <span>Login Nomor HP</span>
                    {loginMethod === 'phone' && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-[2.5px] bg-[#2597d0] rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`pb-2.5 transition-colors relative cursor-pointer ${loginMethod === 'email'
                        ? 'text-[#070709] font-semibold'
                        : 'text-[#8b8b8b] hover:text-[#070709]'
                      }`}
                  >
                    <span>Login Email / NIK</span>
                    {loginMethod === 'email' && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-[2.5px] bg-[#2597d0] rounded-full" />
                    )}
                  </button>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                {mode === 'register' && (
                  <>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-[#8b8b8b]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Lengkap & Gelar (cth: Siti Aminah, A.Md.Keb)"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f5f7fa] border border-transparent focus:border-[#2597d0] focus:bg-white text-[14px] font-runde text-[#070709] outline-none transition-all placeholder:text-[#8b8b8b]"
                      />
                    </div>

                    <div>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        aria-label="Pilih Peran Pelayanan"
                        className="w-full h-11 px-3.5 rounded-xl bg-[#f5f7fa] border border-transparent focus:border-[#2597d0] focus:bg-white text-[14px] font-runde text-[#070709] outline-none transition-all"
                      >
                        <option value="kader">1. Kader Posyandu (Pelaksana Timbang RW)</option>
                        <option value="bidan">2. Bidan Desa / Tenaga Gizi Puskesmas</option>
                        <option value="admin">3. Super Admin Desa / Pengelola Sistem</option>
                        <option value="ortu">4. Orang Tua Balita (Kartu Gizi & MPASI)</option>
                      </select>
                    </div>

                    <div className="relative flex items-center">
                      <Building2 className="absolute left-3.5 w-4 h-4 text-[#8b8b8b]" />
                      <input
                        type="text"
                        required
                        value={posyanduName}
                        onChange={(e) => setPosyanduName(e.target.value)}
                        placeholder="Nama Posyandu & Desa (cth: Posyandu Melati 04)"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f5f7fa] border border-transparent focus:border-[#2597d0] focus:bg-white text-[14px] font-runde text-[#070709] outline-none transition-all placeholder:text-[#8b8b8b]"
                      />
                    </div>
                  </>
                )}

                {/* Identifier Input */}
                <div className="relative flex items-center">
                  {mode === 'register' || loginMethod === 'phone' ? (
                    <Phone className="absolute left-3.5 w-4 h-4 text-[#8b8b8b]" />
                  ) : (
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#8b8b8b]" />
                  )}
                  <input
                    type={
                      mode === 'register' || loginMethod === 'phone'
                        ? 'tel'
                        : 'text'
                    }
                    required
                    value={
                      mode === 'register' || loginMethod === 'phone'
                        ? phone
                        : email
                    }
                    onChange={(e) =>
                      mode === 'register' || loginMethod === 'phone'
                        ? setPhone(e.target.value)
                        : setEmail(e.target.value)
                    }
                    placeholder={
                      mode === 'register' || loginMethod === 'phone'
                        ? 'Nomor WhatsApp / HP (cth: 081234567890)'
                        : 'Email atau NIK Petugas'
                    }
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f5f7fa] border border-transparent focus:border-[#2597d0] focus:bg-white text-[14px] font-runde text-[#070709] outline-none transition-all placeholder:text-[#8b8b8b]"
                  />
                </div>

                {/* Password Input with Show/Hide toggle */}
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#8b8b8b]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata Sandi"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f5f7fa] border border-transparent focus:border-[#2597d0] focus:bg-white text-[14px] font-runde text-[#070709] outline-none transition-all placeholder:text-[#8b8b8b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 text-[#8b8b8b] hover:text-[#070709] cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Agreement Checkbox */}
                <div className="pt-1 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="auth-agreement"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#2563eb] rounded cursor-pointer"
                  />
                  <label
                    htmlFor="auth-agreement"
                    className="font-runde text-[12px] text-[#8b8b8b] leading-snug cursor-pointer select-none"
                  >
                    Saya telah membaca dan menyetujui{' '}
                    <span className="text-[#2597d0] font-medium">Perjanjian Pengguna</span>{' '}
                    serta{' '}
                    <span className="text-[#2597d0] font-medium">
                      Kebijakan Privasi Data Medis
                    </span>
                  </label>
                </div>

                {/* Feedback Message */}
                {submittedMessage && (
                  <div
                    className={`p-3.5 rounded-xl border text-[13px] font-runde ${
                      submittedMessage.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        submittedMessage.type === 'error'
                          ? 'text-rose-800'
                          : 'text-emerald-800'
                      }`}
                    >
                      {submittedMessage.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>{submittedMessage.title}</span>
                    </div>
                    <p
                      className={`mt-1 leading-snug ${
                        submittedMessage.type === 'error'
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {submittedMessage.desc}
                    </p>
                    {submittedMessage.type === 'success' && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white font-medium text-[12px] hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <span>Buka Beranda Posyandu</span>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    )}
                  </div>
                )}

                {/* Submit Action Button (Vibrant Blue Gradient Button from Reference) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 w-full min-h-[46px] rounded-xl bg-linear-to-r from-[#2ea0f7] to-[#2563eb] hover:opacity-95 text-white font-runde font-semibold text-[15px] shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : mode === 'login' ? (
                    'Masuk'
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>
              </form>

              {/* Mode Toggle Footer */}
              <div className="mt-5 text-center">
                {mode === 'login' ? (
                  <p className="font-runde text-[12.5px] text-[#8b8b8b]">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register')
                        setSubmittedMessage(null)
                      }}
                      className="text-[#2597d0] font-semibold hover:underline cursor-pointer"
                    >
                      Daftar Akun
                    </button>
                  </p>
                ) : (
                  <p className="font-runde text-[12.5px] text-[#8b8b8b]">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setSubmittedMessage(null)
                      }}
                      className="text-[#2597d0] font-semibold hover:underline cursor-pointer"
                    >
                      Masuk
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalist */}
      <footer className="relative z-20 w-full max-w-[1320px] mx-auto px-6 sm:px-10 py-4 flex items-center justify-between text-[12px] font-runde text-[#5c7491]">
        <p>© 2026 Tumbuhin. Keamanan Data Medis Terenkripsi.</p>
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-4 h-4 text-[#2597d0]" />
          <span>Terverifikasi Standar Antropometri Kemenkes RI</span>
        </div>
      </footer>
    </div>
  )
}
