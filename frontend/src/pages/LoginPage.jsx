import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleLogin = async (role) => {
    // Simpan ke localStorage dulu
    let identifier = '';
    let email = '';
    let phone = '';
    let password = '';
    
    switch (role) {
      case 'kader':
        identifier = '081288990011';
        email = 'kader@tumbuhin.id';
        phone = '081288990011';
        password = 'kadersehat2026';
        break;
      case 'bidan':
        identifier = '081288990022';
        email = 'bidan@tumbuhin.id';
        phone = '081288990022';
        password = 'bidansiaga2026';
        break;
      case 'admin':
        identifier = '081288990033';
        email = 'admin@tumbuhin.id';
        phone = '081288990033';
        password = 'adminsehat2026';
        break;
      default:
        return;
    }
    
    const result = await login({ identifier, email, phone, password });
    
    if (result.success) {
      // Navigate ke dashboard sesuai role menggunakan hash routing
      window.location.hash = `#${result.redirect_to}`;
    } else {
      alert('Login gagal: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-[#0F9D8A] mb-2">Tumbuhin Login</h1>
        <p className="text-sm text-gray-500 mb-6">Pilih akun demo untuk masuk ke sistem.</p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleLogin('kader')}
            disabled={loading}
            className="w-full py-3 bg-[#0F9D8A] text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk sebagai Kader'}
          </button>
          <button
            onClick={() => handleLogin('bidan')}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk sebagai Bidan'}
          </button>
          <button
            onClick={() => handleLogin('admin')}
            disabled={loading}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
