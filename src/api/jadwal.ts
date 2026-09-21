// src/api/jadwal.ts
import axios from 'axios'; // atau gunakan fetch API bawaan jika tidak memakai axios

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface JadwalPerawatan {
  id_jadwal: number;
  id_mesin: number;
  nama_mesin?: string;
  tanggal_perawatan: string | null;
  status: 'Terjadwal' | 'Selesai';
}

// 1. Mengambil seluruh jadwal perawatan
export const fetchJadwalPerawatan = async (): Promise<JadwalPerawatan[]> => {
  const response = await axios.get(`${API_BASE_URL}/jadwal-perawatan`);
  return response.data;
};

// 2. Mengubah status ke 'Selesai' & mengisi tanggal aktual
export const updateJadwalPerawatan = async (
  id_jadwal: number,
  tanggal_aktual: string
) => {
  const response = await axios.put(`${API_BASE_URL}/jadwal-perawatan/${id_jadwal}`, {
    tanggal_aktual: tanggal_aktual,
    status: 'Selesai'
  });
  return response.data;
};