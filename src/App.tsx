import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  Boxes,
  CalendarCheck,
  ClockAlert,
  ClipboardPenLine,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Plus,
  X,
  Star,
  Loader2,
  Lock,
  User,
  LogOut,
  Truck,
  BellRing,
  Check
} from "lucide-react";
import { postPemakaian, postDowntime } from "./api";
import {
  getSpareparts,
  getDowntime,
  getJadwalPerawatan,
  getReminderPerawatan,
  getMesin,
  getSparepartByMesin,
  updateJadwalPerawatan
} from "./api/sparepart";
import { getSupplier, createSupplier as postSupplier } from "./api/supplier";

// IMPORT LOGO MIROTA
import logoMirota from "./assets/logo-mirota.png";

interface Sparepart {
  id_sparepart: number;
  part_number: string;
  nama_part: string;
  kategori: string | null;
  tingkat_kritikal: string;
  satuan: string;
  created_at?: string;
  stock?: number;
  minStock?: number;
}

interface DowntimeItem {
  id_downtime: number;
  nama_mesin: string;
  tanggal: string;
  durasi_jam: number;
  keterangan: string;
  dicatat_oleh: string;
}

interface JadwalItem {
  id_jadwal: number;
  nama_mesin: string;
  tanggal_perawatan: string | null;
  deskripsi: string;
  status: string;
}

interface ReminderItem {
  id_jadwal: number;
  nama_mesin: string;
  tanggal_perawatan: string;
  deskripsi: string;
}

interface SupplierItem {
  id?: string | number;
  namaSupplier?: string;
  nama_supplier?: string;
  kontak: string;
  email: string;
  alamat: string;
}

const MACHINE_LIST = [
  "Semua Kategori",
  "02_Sack Tip",
  "04_Maintenance",
  "07_Pneumatic System",
  "07_Assy-Parts",
  "08_S IBC",
  "08_Mechanical Construction",
  "10_Intensifier Lid",
  "11_Intensifier Drive"
];

const MONTH_LIST = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "Nopember",
  "Desember"
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });
  const [usernameInput, setUsernameInput] = useState<string>("admin");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [downtimeList, setDowntimeList] = useState<DowntimeItem[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [supplierList, setSupplierList] = useState<SupplierItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("Semua Kategori");
  const [criticalFilter, setCriticalFilter] = useState<string>("semua");

  const [activeModal, setActiveModal] = useState<"downtime" | "pemakaian" | "selesaikan_jadwal" | "supplier" | null>(null);
  
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalItem | null>(null);
  const [tanggalAktual, setTanggalAktual] = useState<string>("");
  const [isUpdatingJadwal, setIsUpdatingJadwal] = useState<boolean>(false);

  const [mesinList, setMesinList] = useState<any[]>([]);
  const [selectedMesinId, setSelectedMesinId] = useState<number | "">("");
  const [filteredPartByMesin, setFilteredPartByMesin] = useState<any[]>([]);
  const [loadingPartMesin, setLoadingPartMesin] = useState<boolean>(false);
  const [searchPartText, setSearchPartText] = useState<string>("");
  
  const [jadwalSearch, setJadwalSearch] = useState<string>("");
  const [statusJadwalFilter, setStatusJadwalFilter] = useState<string>("semua");
  const [bulanJadwalFilter, setBulanJadwalFilter] = useState<string>("semua");
  const [currentJadwalPage, setCurrentJadwalPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 15;
  
  const [durasiJam, setDurasiJam] = useState<number | "">("");
  const [keteranganDowntime, setKeteranganDowntime] = useState<string>("");
  const [qtyPemakaian, setQtyPemakaian] = useState<number>(1);
  const [picName, setPicName] = useState<string>("");

  const [namaSupplier, setNamaSupplier] = useState<string>("");
  const [kontakSupplier, setKontakSupplier] = useState<string>("");
  const [emailSupplier, setEmailSupplier] = useState<string>("");
  const [alamatSupplier, setAlamatSupplier] = useState<string>("");
  const [isSavingSupplier, setIsSavingSupplier] = useState<boolean>(false);

  const refreshJadwal = async () => {
    try {
      const data = await getJadwalPerawatan();
      setJadwalList(data || []);
    } catch (err) {
      console.error("Gagal mengambil jadwal:", err);
    }
  };

  const refreshSupplier = async () => {
    try {
      const data = await getSupplier();
      setSupplierList(data || []);
    } catch (err) {
      console.error("Gagal mengambil daftar supplier:", err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    setIsLoading(true);

    Promise.allSettled([
      getSpareparts(),
      getDowntime(),
      getJadwalPerawatan(),
      getReminderPerawatan(),
      getSupplier(),
      getMesin() 
    ])
      .then(([partsRes, downRes, jadwalRes, remRes, supRes, mesinRes]) => {
        if (partsRes.status === "fulfilled") {
          const val = partsRes.value;
          const rawList = Array.isArray(val) 
            ? val 
            : Array.isArray(val?.data) 
            ? val.data 
            : Array.isArray(val?.data?.data) 
            ? val.data.data 
            : [];

          setSpareparts(
            rawList.map((item: Sparepart) => ({
              ...item,
              stock: item.stock ?? 5,
              minStock: item.minStock ?? 4
            }))
          );
        }
        if (downRes.status === "fulfilled") setDowntimeList(downRes.value || []);
        if (jadwalRes.status === "fulfilled") setJadwalList(jadwalRes.value || []);
        if (remRes.status === "fulfilled") setReminders(remRes.value || []);
        if (supRes.status === "fulfilled") setSupplierList(supRes.value || []);
        if (mesinRes.status === "fulfilled") setMesinList(mesinRes.value || []);
      })
      .catch((err) => console.error("Gagal sinkronisasi data:", err))
      .finally(() => setIsLoading(false));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!selectedMesinId) {
      setFilteredPartByMesin([]);
      return;
    }

    setLoadingPartMesin(true);
    getSparepartByMesin(Number(selectedMesinId))
      .then((data) => setFilteredPartByMesin(data || []))
      .catch((err) => console.error("Gagal mengambil sparepart mesin:", err))
      .finally(() => setLoadingPartMesin(false));
  }, [selectedMesinId]);

  const resetFormModal = () => {
    setActiveModal(null);
    setSelectedMesinId("");
    setDurasiJam("");
    setKeteranganDowntime("");
    setSearchPartText("");
    setQtyPemakaian(1);
    setPicName("");
    setSelectedJadwal(null);
    setTanggalAktual("");
    setNamaSupplier("");
    setKontakSupplier("");
    setEmailSupplier("");
    setAlamatSupplier("");
  };

  const handleSaveDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        mesin_id: Number(selectedMesinId),
        durasi_jam: Number(durasiJam),
        keterangan: keteranganDowntime,
        pic: picName,
      };

      await postDowntime(payload);

      const updatedDowntime = await getDowntime();
      setDowntimeList(updatedDowntime || []);

      resetFormModal();
      alert("Data downtime berhasil disimpan!");
    } catch (err) {
      console.error("Gagal menyimpan downtime:", err);
      alert("Gagal menyimpan data downtime.");
    }
  };

  const handleSavePemakaian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        mesin_id: Number(selectedMesinId),
        part_number: searchPartText.split(" - ")[0],
        qty: Number(qtyPemakaian),
        pic: picName,
      };

      await postPemakaian(payload);

      resetFormModal();
      alert("Data pemakaian sparepart berhasil disimpan!");
    } catch (err) {
      console.error("Gagal menyimpan pemakaian:", err);
      alert("Gagal menyimpan data pemakaian.");
    }
  };

  const handleSaveUpdateJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJadwal || !tanggalAktual) return;

    try {
      setIsUpdatingJadwal(true);
      await updateJadwalPerawatan(selectedJadwal.id_jadwal, tanggalAktual);
      await refreshJadwal();
      resetFormModal();
      alert("Status jadwal berhasil diperbarui menjadi Selesai!");
    } catch (err) {
      console.error("Gagal mengupdate jadwal:", err);
      alert("Gagal memperbarui status jadwal.");
    } finally {
      setIsUpdatingJadwal(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSupplier(true);

      const payload = {
        nama_supplier: namaSupplier,
        kontak: kontakSupplier,
        email: emailSupplier,
        alamat: alamatSupplier,
      };

      await postSupplier(payload);
      await refreshSupplier();

      resetFormModal();
      alert("Data supplier baru berhasil ditambahkan!");
    } catch (err) {
      console.error("Gagal menyimpan supplier:", err);
      alert("Gagal menyimpan data supplier.");
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const downtimeSummary = useMemo(() => {
    const map: { [key: string]: number } = {};
    let totalJam = 0;

    downtimeList.forEach((item) => {
      const durasi = Number(item.durasi_jam) || 0;
      map[item.nama_mesin] = (map[item.nama_mesin] || 0) + durasi;
      totalJam += durasi;
    });

    return Object.keys(map).map((mesin) => {
      const jam = map[mesin];
      const pct = totalJam > 0 ? Number(((jam / totalJam) * 100).toFixed(1)) : 0;
      return { machine: mesin, hours: jam, pct };
    });
  }, [downtimeList]);

  const filteredJadwal = useMemo(() => {
    return jadwalList.filter((j: any) => {
      const term = jadwalSearch.toLowerCase();
      const matchMesin = (j.nama_mesin || "").toLowerCase().includes(term);
      const matchDeskripsi = (j.deskripsi || "").toLowerCase().includes(term);
      const matchText = matchMesin || matchDeskripsi;

      const matchStatus =
        statusJadwalFilter === "semua" ||
        (j.status || "").toLowerCase() === statusJadwalFilter.toLowerCase();

      const matchBulan =
        bulanJadwalFilter === "semua" ||
        (j.deskripsi || "").toLowerCase().includes(bulanJadwalFilter.toLowerCase()) ||
        (j.tanggal_perawatan || "").toLowerCase().includes(bulanJadwalFilter.toLowerCase());

      return matchText && matchStatus && matchBulan;
    });
  }, [jadwalList, jadwalSearch, statusJadwalFilter, bulanJadwalFilter]);

  const paginatedJadwal = useMemo(() => {
    const startIndex = (currentJadwalPage - 1) * ITEMS_PER_PAGE;
    return filteredJadwal.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredJadwal, currentJadwalPage]);

  const totalJadwalPages = Math.ceil(filteredJadwal.length / ITEMS_PER_PAGE);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === "admin" && passwordInput === "mirota123") {
      setIsLoggedIn(true);
      sessionStorage.setItem("isLoggedIn", "true");
      setLoginError("");
    } else {
      setLoginError("Username atau password salah!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("isLoggedIn");
    setUsernameInput("");
    setPasswordInput("");
  };

  const filteredParts = useMemo(() => {
    return spareparts.filter((item) => {
      const pNum = item.part_number ? item.part_number.toLowerCase() : "";
      const pName = item.nama_part ? item.nama_part.toLowerCase() : "";
      const sTerm = searchTerm.toLowerCase();

      const matchSearch = pNum.includes(sTerm) || pName.includes(sTerm);
      const matchKategori =
        selectedKategori === "Semua Kategori" || item.kategori === selectedKategori;
      
      const itemKritikal = (item.tingkat_kritikal || "").toLowerCase();
      const matchCritical =
        criticalFilter === "semua" || itemKritikal === criticalFilter;

      return matchSearch && matchKategori && matchCritical;
    });
  }, [spareparts, searchTerm, selectedKategori, criticalFilter]);

  const handlePakaiPart = (id: number) => {
    setSpareparts((prev) =>
      prev.map((item) =>
        item.id_sparepart === id
          ? { ...item, stock: Math.max(0, (item.stock ?? 1) - 1) }
          : item
      )
    );
  };

  const criticalCount = spareparts.filter(
    (p) => p.tingkat_kritikal?.toLowerCase() === "tinggi"
  ).length;

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 px-4 font-sans text-slate-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex items-center justify-center">
              <img 
                src={logoMirota} 
                alt="Logo PT Mirota KSM" 
                className="h-12 w-auto object-contain max-w-[160px]" 
              />
            </div>
            <h1 className="text-base font-bold text-white tracking-wide">PT MIROTA KSM</h1>
            <p className="text-xs text-slate-400">Maintenance & WMS Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="rounded-lg border border-red-800 bg-red-950/60 p-2.5 text-center text-xs text-red-400">
                {loginError}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-orange-600 py-2 text-xs font-semibold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-500"
            >
              Masuk Dashboard
            </button>
          </form>

          <p className="mt-5 text-center text-[10px] text-slate-500">
            INTERNAL ACCESS ONLY - PT MIROTA KSM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between p-4 shrink-0">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-800">
              <img 
                src={logoMirota} 
                alt="Logo PT Mirota KSM" 
                className="h-6 w-auto object-contain max-w-[120px]" 
              />
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white">PT MIROTA KSM</h1>
                <p className="text-[11px] text-slate-400">Maintenance & WMS</p>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-lg p-2.5 mb-5 border border-slate-700/50">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Shift Berjalan</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Shift 1 Aktif
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">08:00 – 16:00 WIB</div>
            </div>

            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard Ringkasan", icon: LayoutDashboard },
                { id: "katalog", label: "Katalog Sparepart", icon: Boxes, badge: spareparts.length.toString() },
                { id: "jadwal", label: "Jadwal Perawatan", icon: CalendarCheck, badge: jadwalList.length.toString() },
                { id: "downtime", label: "Log Downtime", icon: ClockAlert, badge: downtimeList.length.toString() },
                { id: "supplier", label: "Data Supplier", icon: Truck, badge: supplierList.length.toString() }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? "bg-orange-700 text-white"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                KSM
              </div>
              <div>
                <p className="text-slate-200 font-medium">ADMIN</p>
                <p className="text-[10px] text-emerald-400">Database Connected</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar / Logout"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950 pb-16 md:pb-0">
          <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xs sm:text-sm text-slate-200 truncate">
                {activeMenu === "dashboard" && "Dashboard Operasional"}
                {activeMenu === "katalog" && "Katalog Sparepart"}
                {activeMenu === "jadwal" && "Jadwal Perawatan Mesin"}
                {activeMenu === "downtime" && "Pencatatan Log Downtime"}
                {activeMenu === "supplier" && "Daftar Mitra Supplier"}
              </h2>

              <button
                onClick={handleLogout}
                className="flex md:hidden items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 text-xs rounded-lg border border-slate-700 transition"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal("supplier")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>+ Supplier</span>
              </button>

              <button
                onClick={() => setActiveModal("downtime")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
              >
                <ClockAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Downtime</span>
              </button>

              <button
                onClick={() => setActiveModal("pemakaian")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 py-1.5 px-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pemakaian</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 pb-20 md:pb-5">
            
            {reminders.length > 0 && (
              <div className="bg-amber-950/50 border border-amber-800 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-200 shadow-lg">
                <BellRing className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1">
                  <div className="font-bold text-amber-300">
                    Pengingat Perawatan Mesin (Jadwal Besok)
                  </div>
                  <div className="mt-1 space-y-1">
                    {reminders.map((r) => (
                      <div key={r.id_jadwal} className="flex flex-wrap gap-1 text-[11px]">
                        <span className="font-semibold text-white">{r.nama_mesin}:</span>
                        <span>{r.deskripsi}</span>
                        <span className="text-amber-400 font-mono">({r.tanggal_perawatan})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeMenu === "dashboard" && (
              <>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">Total Sparepart Terdaftar</span>
                      <Boxes className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-xl font-bold text-white">
                      {spareparts.length}{" "}
                      <span className="text-xs font-normal text-slate-400">item</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Data Realtime MySQL
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-amber-300">Part Kritikal</span>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-amber-400">
                      {criticalCount} <span className="text-xs font-normal text-slate-400">part</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-amber-400/80">Kategori Prioritas Tinggi</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">Downtime Tercatat</span>
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-white">
                      {downtimeList.reduce((sum, item) => sum + (Number(item.durasi_jam) || 0), 0).toFixed(1)}{" "}
                      <span className="text-xs font-normal text-slate-400">Jam Total</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-emerald-400 font-medium">Berdasarkan Log MySQL</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">Jadwal Perawatan</span>
                      <CalendarCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-white">
                      {jadwalList.length} <span className="text-xs font-normal text-slate-400">agenda</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-400">Tersinkronisasi API</div>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Sparepart Kritis Terbaru
                      </h3>
                      <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                        Prioritas
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {spareparts
                        .filter(
                          (p) =>
                            p.tingkat_kritikal?.toLowerCase() === "tinggi" ||
                            p.tingkat_kritikal?.toLowerCase() === "sedang"
                        )
                        .slice(0, 5)
                        .map((p) => (
                          <div
                            key={p.id_sparepart}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                <span className="text-xs font-mono font-bold text-slate-200 truncate">
                                  {p.part_number}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">{p.nama_part}</p>
                              <div className="flex gap-1 mt-1">
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded truncate">
                                  {p.kategori ?? "Umum"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                                {p.tingkat_kritikal}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">Downtime per Mesin</h3>
                        <p className="text-[10px] text-slate-400">Total jam downtime aktual dari database</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">Data Live</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {downtimeSummary.length === 0 ? (
                        <div className="text-xs text-slate-500 py-4 text-center">
                          Belum ada catatan downtime yang terdaftar di database.
                        </div>
                      ) : (
                        downtimeSummary.map((item) => (
                          <div key={item.machine} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-medium truncate max-w-[180px]">
                                {item.machine}
                              </span>
                              <span className="font-mono text-slate-400 text-[11px]">
                                {item.hours} Jam ({item.pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.pct > 30
                                    ? "bg-red-500"
                                    : item.pct > 15
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, item.pct)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {(activeMenu === "katalog" || activeMenu === "dashboard") && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-orange-500" />
                    Inventaris Sparepart (Live MySQL)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Tersinkronisasi otomatis dengan server rekanmu
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari part number / deskripsi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={selectedKategori}
                      onChange={(e) => setSelectedKategori(e.target.value)}
                      className="flex-1 min-w-[130px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      {MACHINE_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      value={criticalFilter}
                      onChange={(e) => setCriticalFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                    >
                      <option value="semua">Semua Tingkat Kritikal</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="sedang">Sedang</option>
                      <option value="rendah">Rendah</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Kritikal</th>
                        <th className="px-3 py-2">Part No</th>
                        <th className="px-3 py-2">Nama Part</th>
                        <th className="px-3 py-2">Kategori</th>
                        <th className="px-3 py-2 text-center">Satuan</th>
                        <th className="px-3 py-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                              <span>Memuat data dari database rekanmu...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredParts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-slate-500 text-xs">
                            Tidak ada sparepart yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredParts.map((item) => {
                          const isHigh = item.tingkat_kritikal?.toLowerCase() === "tinggi";
                          const isMedium = item.tingkat_kritikal?.toLowerCase() === "sedang";

                          return (
                            <tr key={item.id_sparepart} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] border font-medium ${
                                    isHigh
                                      ? "bg-red-950 text-red-400 border-red-800 font-bold"
                                      : isMedium
                                      ? "bg-amber-950 text-amber-400 border-amber-800"
                                      : "bg-emerald-950 text-emerald-400 border-emerald-800"
                                  }`}
                                >
                                  {item.tingkat_kritikal ?? "Rendah"}
                                </span>
                              </td>

                              <td className="px-3 py-2 font-mono font-semibold text-slate-100 whitespace-nowrap">
                                {item.part_number || "-"}
                              </td>

                              <td className="px-3 py-2 max-w-[200px] truncate text-slate-200">
                                {item.nama_part}
                              </td>

                              <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                                {item.kategori ?? "-"}
                              </td>

                              <td className="px-3 py-2 text-center whitespace-nowrap font-mono text-slate-400">
                                {item.satuan}
                              </td>

                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handlePakaiPart(item.id_sparepart)}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-200 rounded border border-slate-700 text-[10px] transition"
                                >
                                  Pakai
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === "downtime" && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <ClockAlert className="w-4 h-4 text-amber-500" /> Log Catatan Downtime Mesin
                </h3>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Mesin</th>
                        <th className="px-3 py-2">Tanggal</th>
                        <th className="px-3 py-2">Durasi (Jam)</th>
                        <th className="px-3 py-2">Keterangan</th>
                        <th className="px-3 py-2">Dicatat Oleh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {downtimeList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-500">
                            Belum ada riwayat downtime.
                          </td>
                        </tr>
                      ) : (
                        downtimeList.map((d) => (
                          <tr key={d.id_downtime} className="hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-white">{d.nama_mesin}</td>
                            <td className="px-3 py-2 text-slate-400 font-mono">{d.tanggal}</td>
                            <td className="px-3 py-2 text-amber-400 font-mono">{d.durasi_jam} Jam</td>
                            <td className="px-3 py-2 text-slate-300">{d.keterangan}</td>
                            <td className="px-3 py-2 text-slate-400">{d.dicatat_oleh}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === "jadwal" && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-500" /> Jadwal Perawatan Mesin
                    </h3>
                    <p className="text-[10px] text-slate-400">Total {filteredJadwal.length} agenda perawatan terdata</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={bulanJadwalFilter}
                      onChange={(e) => {
                        setBulanJadwalFilter(e.target.value);
                        setCurrentJadwalPage(1);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="semua">Semua Bulan</option>
                      {MONTH_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusJadwalFilter}
                      onChange={(e) => {
                        setStatusJadwalFilter(e.target.value);
                        setCurrentJadwalPage(1);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Selesai">Selesai</option>
                    </select>

                    <div className="relative w-full sm:w-48">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari mesin / tindakan..."
                        value={jadwalSearch}
                        onChange={(e) => {
                          setJadwalSearch(e.target.value);
                          setCurrentJadwalPage(1);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Mesin</th>
                        <th className="px-3 py-2">Tanggal Perawatan</th>
                        <th className="px-3 py-2">Deskripsi Tindakan</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {paginatedJadwal.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-500">
                            Tidak ada agenda perawatan yang sesuai.
                          </td>
                        </tr>
                      ) : (
                        paginatedJadwal.map((j: JadwalItem) => {
                          const isTerjadwal = j.status === "Terjadwal";

                          return (
                            <tr key={j.id_jadwal} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2 font-bold text-white">{j.nama_mesin}</td>
                              <td className="px-3 py-2 font-mono text-slate-400">
                                {j.tanggal_perawatan ? (
                                  j.tanggal_perawatan
                                ) : (
                                  <span className="text-slate-600 italic">(-)</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-300">{j.deskripsi}</td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                    isTerjadwal
                                      ? "bg-amber-950/80 text-amber-400 border-amber-800"
                                      : "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                                  }`}
                                >
                                  {j.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                {isTerjadwal ? (
                                  <button
                                    onClick={() => {
                                      setSelectedJadwal(j);
                                      setActiveModal("selesaikan_jadwal");
                                    }}
                                    className="flex items-center gap-1 mx-auto px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium transition"
                                  >
                                    <Check className="w-3 h-3" /> Selesaikan
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {totalJadwalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span>
                      Halaman <strong className="text-slate-200">{currentJadwalPage}</strong> dari <strong className="text-slate-200">{totalJadwalPages}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentJadwalPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentJadwalPage === 1}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 border border-slate-700"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentJadwalPage((prev) => Math.min(prev + 1, totalJadwalPages))}
                        disabled={currentJadwalPage === totalJadwalPages}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 border border-slate-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeMenu === "supplier" && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-500" /> Data Mitra Supplier
                  </h3>
                  <button
                    onClick={() => setActiveModal("supplier")}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Supplier</span>
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Nama Supplier</th>
                        <th className="px-3 py-2">Kontak</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Alamat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {supplierList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-500">
                            Data supplier masih kosong.
                          </td>
                        </tr>
                      ) : (
                        supplierList.map((s, idx) => (
                          <tr key={s.id ?? idx} className="hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-white">
                              {s.nama_supplier || s.namaSupplier}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-300">{s.kontak}</td>
                            <td className="px-3 py-2 text-blue-400">{s.email}</td>
                            <td className="px-3 py-2 text-slate-400 max-w-xs truncate">{s.alamat}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-slate-900 border-t border-slate-800 items-center justify-around py-2 px-1 shrink-0 pb-safe shadow-2xl">
            {[
              { id: "dashboard", label: "Home", icon: LayoutDashboard },
              { id: "katalog", label: "Part", icon: Boxes },
              { id: "jadwal", label: "Servis", icon: CalendarCheck },
              { id: "downtime", label: "Downtime", icon: ClockAlert },
              { id: "supplier", label: "Supplier", icon: Truck }
            ].map((m) => {
              const Icon = m.icon;
              const isActive = activeMenu === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMenu(m.id)}
                  className={`flex flex-col items-center gap-0.5 text-[10px] p-1 ${
                    isActive ? "text-orange-500 font-semibold" : "text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>
        </main>
      </div>

      {/* MODAL SELESAIKAN JADWAL */}
      {activeModal === "selesaikan_jadwal" && selectedJadwal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Selesaikan Jadwal Perawatan
              </h3>
              <button onClick={resetFormModal} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdateJadwal} className="space-y-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <p className="text-slate-400">
                  Mesin: <strong className="text-white">{selectedJadwal.nama_mesin}</strong>
                </p>
                <p className="text-slate-400 truncate">
                  Deskripsi: <span className="text-slate-200">{selectedJadwal.deskripsi}</span>
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Tanggal Pengerjaan Riil / Aktual <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={tanggalAktual}
                  onChange={(e) => setTanggalAktual(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetFormModal}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                  disabled={isUpdatingJadwal}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingJadwal}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {isUpdatingJadwal && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Simpan & Selesaikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PEMAKAIAN PART */}
      {activeModal === "pemakaian" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ClipboardPenLine className="w-4 h-4 text-orange-500" /> Log Pemakaian Part
              </h3>
              <button 
                onClick={resetFormModal} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePemakaian} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-0.5">Pilih Mesin / Aset</label>
                <select 
                  value={selectedMesinId}
                  onChange={(e) => setSelectedMesinId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-orange-500 focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Mesin Terlebih Dahulu --</option>
                  {mesinList.map((m: any) => (
                    <option key={m.id_mesin} value={m.id_mesin}>
                      {m.nama_mesin}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5">Pilih / Ketik Sparepart</label>
                <input
                  type="text"
                  disabled={!selectedMesinId || loadingPartMesin}
                  placeholder={
                    !selectedMesinId
                      ? "Pilih mesin di atas dulu..."
                      : loadingPartMesin
                      ? "Memuat part..."
                      : "Ketik nama part atau part number..."
                  }
                  value={searchPartText}
                  onChange={(e) => setSearchPartText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs focus:border-orange-500 focus:outline-none disabled:opacity-40"
                  required
                />

                {selectedMesinId && !loadingPartMesin && (
                  <div className="mt-1 max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded divide-y divide-slate-800/60">
                    {filteredPartByMesin
                      .filter((p: any) => {
                        const q = searchPartText.toLowerCase();
                        return (
                          (p.part_number || "").toLowerCase().includes(q) ||
                          (p.nama_part || "").toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 30)
                      .map((p: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSearchPartText(`${p.part_number} - ${p.nama_part}`)}
                          className="p-1.5 hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white flex justify-between items-center text-[11px]"
                        >
                          <span className="font-mono text-orange-400">{p.part_number}</span>
                          <span className="truncate ml-2 text-slate-300">{p.nama_part}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5">Jumlah (Qty)</label>
                  <input
                    type="number"
                    value={qtyPemakaian}
                    onChange={(e) => setQtyPemakaian(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Nama PIC</label>
                  <input
                    type="text"
                    placeholder="Teknisi..."
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetFormModal}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOWNTIME */}
      {activeModal === "downtime" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ClockAlert className="w-4 h-4 text-amber-500" /> Catat Downtime Mesin
              </h3>
              <button onClick={resetFormModal} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDowntime} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-0.5">Pilih Mesin / Aset</label>
                <select 
                  value={selectedMesinId}
                  onChange={(e) => setSelectedMesinId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Mesin --</option>
                  {mesinList.map((m: any) => (
                    <option key={m.id_mesin} value={m.id_mesin}>
                      {m.nama_mesin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5">Durasi (Jam)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Contoh: 1.5"
                    value={durasiJam}
                    onChange={(e) => setDurasiJam(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Nama PIC</label>
                  <input
                    type="text"
                    placeholder="Teknisi..."
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5">Penyebab Masalah / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kendala..."
                  value={keteranganDowntime}
                  onChange={(e) => setKeteranganDowntime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetFormModal}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SUPPLIER BARU */}
      {activeModal === "supplier" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-500" /> Tambah Mitra Supplier Baru
              </h3>
              <button onClick={resetFormModal} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-0.5">Nama Supplier / PT <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: PT. Teknik Jaya Mandiri"
                  value={namaSupplier}
                  onChange={(e) => setNamaSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5">Kontak / HP <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={kontakSupplier}
                    onChange={(e) => setKontakSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Email</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={emailSupplier}
                    onChange={(e) => setEmailSupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5">Alamat Kantor / Gudang</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap supplier..."
                  value={alamatSupplier}
                  onChange={(e) => setAlamatSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetFormModal}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                  disabled={isSavingSupplier}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupplier}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {isSavingSupplier && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Simpan Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}