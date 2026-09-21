// URL Backend Ngrok
const BASE_URL = "https://uncork-cola-travel.ngrok-free.dev/api";

// Header standar untuk bypass halaman peringatan ngrok & kirim JSON
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

// 1. Ambil Semua Sparepart
export const getSpareparts = async () => {
  const res = await fetch(`${BASE_URL}/sparepart`, {
    headers: DEFAULT_HEADERS,
  });
  if (!res.ok) throw new Error("Gagal mengambil data sparepart");
  return res.json();
};

// 2. Ambil Sparepart Khusus Mesin Tertentu
export const fetchSparepartsByMesin = async (mesinId: number) => {
  const res = await fetch(`${BASE_URL}/sparepart/mesin/${mesinId}`, {
    headers: DEFAULT_HEADERS,
  });
  if (!res.ok) throw new Error("Gagal mengambil sparepart mesin");
  return res.json();
};

// 3. Ambil Jadwal Perawatan
export const fetchJadwal = async () => {
  const res = await fetch(`${BASE_URL}/jadwal`, {
    headers: DEFAULT_HEADERS,
  });
  if (!res.ok) throw new Error("Gagal mengambil jadwal perawatan");
  return res.json();
};

// 4. Ambil Log Downtime
export const fetchDowntime = async () => {
  const res = await fetch(`${BASE_URL}/downtime`, {
    headers: DEFAULT_HEADERS,
  });
  if (!res.ok) throw new Error("Gagal mengambil log downtime");
  return res.json();
};

// 5. Submit Form Downtime Baru
export const postDowntime = async (payload: {
  mesin_id: number;
  durasi_jam: number;
  keterangan: string;
  pic: string;
}) => {
  const res = await fetch(`${BASE_URL}/downtime`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal menyimpan data downtime");
  return res.json();
};

// 6. Submit Form Pemakaian Sparepart Baru
export const postPemakaian = async (payload: {
  mesin_id: number;
  part_number: string;
  qty: number;
  pic: string;
}) => {
  const res = await fetch(`${BASE_URL}/pemakaian`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal menyimpan data pemakaian");
  return res.json();
};