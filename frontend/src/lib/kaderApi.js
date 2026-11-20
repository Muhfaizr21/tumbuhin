import { getStoredUser } from './authApi';

const API_BASE = 'http://localhost:8080/api/v1/kader';

const getHeaders = () => {
  const user = getStoredUser();
  return {
    'Content-Type': 'application/json',
    'Authorization': user ? `Bearer ${user.token}` : '',
  };
};

export const kaderApi = {
  // 1.2 Data & Profil Balita
  getBalitaList: async () => {
    const res = await fetch(`${API_BASE}/balita`, { headers: getHeaders() });
    return res.json();
  },
  registerBalita: async (data) => {
    const res = await fetch(`${API_BASE}/balita`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 1.3 Input Timbang & Z-Score
  postTimbang: async (data) => {
    const res = await fetch(`${API_BASE}/timbang`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 1.4 OCR KMS
  postOCR: async (formData) => {
    const res = await fetch(`${API_BASE}/ocrkms`, {
      method: 'POST',
      headers: { 'Authorization': getHeaders().Authorization }, // Tanpa Content-Type untuk multipart
      body: formData,
    });
    return res.json();
  },

  // 1.5 AI Nutri-Chef
  generateResep: async (params) => {
    const res = await fetch(`${API_BASE}/nutrichef/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  },

  // 1.6 Sinkronisasi
  syncOfflineData: async (data) => {
    const res = await fetch(`${API_BASE}/sinkronisasi/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }
};
