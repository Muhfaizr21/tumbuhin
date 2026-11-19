import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);

  const login = (role) => {
    const mockUsers = {
      kader: { id: 'k1', name: 'Bu Sari', role: 'kader', posyandu: 'Melati 04' },
      bidan: { id: 'b1', name: 'Bidan Desa', role: 'bidan', puskesmas: 'Puskesmas Utama' },
      admin: { id: 'a1', name: 'Admin Desa', role: 'admin' },
    };
    const user = mockUsers[role];
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
