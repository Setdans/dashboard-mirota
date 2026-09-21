import axios from 'axios';

const api = axios.create({
  baseURL: 'https://uncork-cola-travel.ngrok-free.dev/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export interface DowntimeItem {
  id_downtime?: number;
  nama_mesin: string;
  tanggal?: string;
  durasi_jam: number | string;
  keterangan?: string;
  dicatat_oleh?: string;
}

export const getDowntime = async (): Promise<DowntimeItem[]> => {
  const response = await api.get('/downtime');
  return response.data.data;
};

export default api;