export { getSpareparts } from "./index";

const BASE_URL = 'https://uncork-cola-travel.ngrok-free.dev/api';

const headers = {
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json'
};

export async function getMesin() {
  const res = await fetch(`${BASE_URL}/mesin`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil data mesin');
  const json = await res.json();
  return json.data;
}

export async function getSparepartByMesin(idMesin: string | number) {
  const res = await fetch(`${BASE_URL}/mesin/${idMesin}/sparepart`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil sparepart mesin');
  const json = await res.json();
  return json.data;
}

export async function getSparepartLengkap() {
  const res = await fetch(`${BASE_URL}/sparepart`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil daftar sparepart');
  const json = await res.json();
  return json.data;
}

export async function getStokRendah() {
  const res = await fetch(`${BASE_URL}/stok/rendah`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil data stok rendah');
  const json = await res.json();
  return json.data;
}

export async function getSparepartKritikal() {
  const res = await fetch(`${BASE_URL}/sparepart/kritikal`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil sparepart kritikal');
  const json = await res.json();
  return json.data;
}

export async function getDowntime() {
  const res = await fetch(`${BASE_URL}/downtime`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil data downtime');
  const json = await res.json();
  return json.data;
}

export async function getJadwalPerawatan() {
  const res = await fetch(`${BASE_URL}/jadwal-perawatan`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil jadwal perawatan');
  const json = await res.json();
  return json.data;
}

// FUNGSI BARU: Update Status Jadwal Perawatan (PUT)
export async function updateJadwalPerawatan(id_jadwal: number, tanggal_aktual: string) {
  const res = await fetch(`${BASE_URL}/jadwal-perawatan/${id_jadwal}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      tanggal_aktual: tanggal_aktual,
      status: 'Selesai'
    })
  });
  if (!res.ok) throw new Error('Gagal memperbarui jadwal perawatan');
  return res.json();
}

export async function getReminderPerawatan() {
  const res = await fetch(`${BASE_URL}/jadwal-perawatan/reminder`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil reminder perawatan');
  const json = await res.json();
  return json.data;
}

export async function getSupplier() {
  const res = await fetch(`${BASE_URL}/supplier`, { headers });
  if (!res.ok) throw new Error('Gagal mengambil data supplier');
  const json = await res.json();
  return json.data;
}