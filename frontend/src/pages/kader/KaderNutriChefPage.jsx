import { useState, useEffect } from 'react'
import { 
  ChefHat, 
  Utensils, 
  Coins, 
  AlertTriangle, 
  Volume2, 
  Send, 
  Sparkles,
  CheckCircle2,
  BookOpen,
  Info
} from 'lucide-react'
import { postRoleData, fetchRoleDashboardData } from '../../lib/authApi'

// Helper kirim WA
const sendWhatsApp = (balita, recipe) => {
  if (!balita || !recipe) return
  let phone = String(recipe.recipientWa || balita.no_wa || balita.noWA || '').replace(/[^0-9]/g, '')
  if (!phone || phone === '-') {
    alert('Nomor WhatsApp Ibu belum terisi. Lengkapi data balita dulu.')
    return
  }
  if (phone.startsWith('0')) phone = '62' + phone.slice(1)
  if (!phone.startsWith('62')) phone = '62' + phone

  const message = `*Rekomendasi Resep MPASI Lokal (AI Nutri-Chef)*
Untuk: ${recipe.balitaNama || balita.nama}

Menu: ${recipe.title}
Target Usia: ${recipe.targetAge}
Tekstur: ${recipe.texture}
Energi: ${recipe.energy} | Protein: ${recipe.protein}
Estimasi Biaya: Rp ${recipe.totalCost}

*Bahan:*
${recipe.ingredients.map((i) => `- ${i.name} (${i.qty})`).join('\n')}

*Langkah Memasak:*
${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

*Sumber:* ${recipe.citation}`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
}

const LOCAL_FOODS = [
  { id: 'telur', name: 'Telur Ayam', price: 2000, unit: 'butir', cat: 'Protein Hewani' },
  { id: 'lele', name: 'Ikan Lele', price: 5000, unit: 'ekor', cat: 'Protein Hewani' },
  { id: 'hati', name: 'Hati Ayam', price: 3000, unit: 'potong', cat: 'Protein Hewani' },
  { id: 'tempe', name: 'Tempe', price: 1000, unit: 'potong', cat: 'Protein Nabati' },
  { id: 'bayam', name: 'Bayam', price: 2000, unit: 'ikat', cat: 'Sayur' },
  { id: 'kelor', name: 'Daun Kelor', price: 0, unit: 'petik', cat: 'Sayur' },
  { id: 'labu', name: 'Labu Kuning', price: 2000, unit: 'potong', cat: 'Sayur' },
  { id: 'minyak', name: 'Minyak Kelapa', price: 500, unit: 'sdm', cat: 'Lemak' },
]

export default function KaderNutriChefPage() {
  const [balitaList, setBalitaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBalitaId, setSelectedBalitaId] = useState('')
  const [budget, setBudget] = useState(15000)
  const [selectedFoods, setSelectedFoods] = useState(['telur', 'bayam', 'minyak'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipe, setRecipe] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await fetchRoleDashboardData('/kader/balita')
        if (Array.isArray(data)) {
          setBalitaList(data)
        }
      } catch (err) {
        console.error('Failed to load balita:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const selectedBalita = balitaList.find(b => b.id === selectedBalitaId)

  const toggleFood = (id) => {
    setSelectedFoods(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const generateRecipe = async () => {
    if (!selectedBalitaId) return
    setIsGenerating(true)
    
    try {
        const result = await postRoleData('/kader/nutrichef/generate', {
            balitaId: selectedBalitaId,
            budget: budget,
            foods: selectedFoods
        })
        setRecipe(result)
    } catch (err) {
        alert('Gagal generate resep: ' + err.message)
    } finally {
        setIsGenerating(false)
    }
  }

  const handleSpeak = () => {
    if (!recipe || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const text = `Resep MPASI, ${recipe.title}. Bahan-bahan: ${recipe.ingredients.map(i => i.name).join(', ')}. Langkah memasak: ${recipe.steps.join(' ')}`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Kolom Kiri: Input Parameter */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-black/8 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#070709]">AI Nutri-Chef</h2>
              <p className="text-xs text-gray-500">Generator Resep MPASI Lokal</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Pilih Balita (Konteks Klinis) */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700">Pilih Balita (Konteks)</label>
              <select 
                value={selectedBalitaId}
                onChange={e => setSelectedBalitaId(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">{loading ? 'Memuat data...' : '-- Pilih Balita --'}</option>
                {balitaList.map(b => (
                  <option key={b.id} value={b.id}>{b.nama} ({b.usia})</option>
                ))}
              </select>
              {selectedBalita && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
                  <p className="text-[11px] text-blue-700 leading-tight">
                    <strong>Status:</strong> {selectedBalita.status_gizi || selectedBalita.statusGizi || '-'} • 
                    <strong> Alergi:</strong> {selectedBalita.alergi || 'Tidak Ada'}
                  </p>
                </div>
              )}
            </div>

            {/* Budget Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-gray-700">Batas Anggaran Harian</label>
                <span className="text-sm font-bold text-orange-600">Rp {budget.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="5000" max="30000" step="1000"
                value={budget}
                onChange={e => setBudget(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                <span>Ekonomis</span>
                <span>Premium</span>
              </div>
            </div>

            {/* Food Selection */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-700">Bahan Lokal Tersedia</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCAL_FOODS.map(food => (
                  <button
                    key={food.id}
                    onClick={() => toggleFood(food.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedFoods.includes(food.id)
                        ? 'bg-orange-50 border-orange-200 border-2'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <p className="text-[11px] font-bold text-gray-700">{food.name}</p>
                    <p className="text-[9px] text-gray-400">Rp {food.price} / {food.unit}</p>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={generateRecipe}
              disabled={isGenerating || !selectedBalitaId}
              className="w-full py-4 rounded-2xl bg-[#070709] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/90 disabled:opacity-50 transition-all shadow-lg shadow-black/10"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mencari Pedoman Kemenkes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  Generate Resep (RAG AI)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Recipe Card Output */}
      <div className="lg:col-span-7">
        {!recipe ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-gray-400">
            <Utensils className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm italic">Pilih balita dan bahan makanan, lalu klik Generate untuk menyusun menu MPASI tervalidasi.</p>
          </div>
        ) : (
          <div className="bg-white border border-black/8 rounded-3xl overflow-hidden shadow-2xs">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">Target: {recipe.targetAge}</span>
                  <h3 className="text-xl font-black mt-1">{recipe.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-80 uppercase font-bold tracking-tighter">Estimasi Biaya</p>
                  <p className="text-lg font-black">Rp {recipe.totalCost}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl border border-black/5 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Tekstur</p>
                  <p className="text-xs font-bold text-gray-700">{recipe.texture}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-black/5 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Energi</p>
                  <p className="text-xs font-bold text-gray-700">{recipe.energy}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-black/5 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Protein</p>
                  <p className="text-xs font-bold text-gray-700">{recipe.protein}</p>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="text-[13px] font-bold text-[#070709] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  Bahan & Takaran
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-xl bg-orange-50/30 border border-orange-100">
                      <span className="text-xs text-gray-700">{ing.name}</span>
                      <span className="text-xs font-bold text-[#070709]">{ing.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h4 className="text-[13px] font-bold text-[#070709] mb-3">Langkah Memasak</h4>
                <div className="space-y-2">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-3 text-xs leading-relaxed text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-[10px]">{i+1}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citation (RAG Proof) */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Sitasi Resmi Kemenkes RI</p>
                  <p className="text-[11px] text-emerald-700 italic">{recipe.citation}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={handleSpeak}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Dengar Suara
                </button>
                <button
                  onClick={() => sendWhatsApp(selectedBalita, recipe)}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Kirim WA Ibu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
