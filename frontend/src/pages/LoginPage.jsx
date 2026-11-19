import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-[#0F9D8A] mb-2">Tumbuhin Login</h1>
        <p className="text-sm text-gray-500 mb-6">Pilih akun demo untuk masuk ke sistem.</p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleLogin('kader')}
            className="w-full py-3 bg-[#0F9D8A] text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Masuk sebagai Kader
          </button>
          <button
            onClick={() => handleLogin('bidan')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Masuk sebagai Bidan
          </button>
          <button
            onClick={() => handleLogin('admin')}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Masuk sebagai Admin
          </button>
        </div>
      </div>
    </div>
  );
}
