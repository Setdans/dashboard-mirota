export interface Supplier {
  id?: string | number;
  nama_supplier: string;
  kontak: string;
  email: string;
  alamat: string;
}

// Tambahkan endpoint /supplier secara spesifik
const API_URL = "https://uncork-cola-travel.ngrok-free.dev/api/supplier";

export const getSupplier = async (): Promise<Supplier[]> => {
  const res = await fetch(API_URL, {
    headers: {
      // Header ini wajib agar ngrok tidak menampilkan halaman peringatan HTML
      "ngrok-skip-browser-warning": "69420",
    },
  });
  if (!res.ok) throw new Error("Gagal mengambil data supplier");

  const result = await res.json();

  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  return [];
};

export const createSupplier = async (data: Supplier) => {
  const { id, ...payload } = data;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Bypass halaman peringatan ngrok
      "ngrok-skip-browser-warning": "69420",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Detail Error FastAPI:", errorData);

    const errorMessage =
      typeof errorData.detail === "string"
        ? errorData.detail
        : JSON.stringify(errorData.detail) || "Gagal menyimpan ke server";

    throw new Error(errorMessage);
  }

  return res.json();
};