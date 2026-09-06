"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  History,
  CheckCircle2,
  Mail,
  Phone,
  Clock,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  Truck,
  CreditCard,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import {
  getAdminStaffData,
  createStaffMemberAction,
  updateStaffMemberStatusAction,
} from "@/app/actions/admin";

export default function AdminStaffPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedOperatorForAudit, setSelectedOperatorForAudit] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New staff modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "OPERATOR" | "COMPLIANCE">("OPERATOR");
  const [title, setTitle] = useState("Esnaf Operasyon Uzmanı");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const res = await getAdminStaffData();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateStaff = async () => {
    if (!name.trim() || !email.trim() || !title.trim()) {
      showToast("Lütfen ad, e-posta ve unvan alanlarını doldurun.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createStaffMemberAction({
        name,
        email,
        phone,
        role,
        title,
      });
      if (res.success) {
        showToast("Yeni personel başarıyla eklendi.");
        setIsAddModalOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        loadData();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Personel eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "ON_LEAVE" : "ACTIVE";
    try {
      const res = await updateStaffMemberStatusAction(staffId, nextStatus as any);
      if (res.success) {
        showToast(`Personel durumu "${nextStatus === "ACTIVE" ? "Aktif" : "İzinde"}" olarak güncellendi.`);
        loadData();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Durum güncellenemedi.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Personel & Operatör Kadrosu Yükleniyor...</span>
      </div>
    );
  }

  const staffMembers = data?.staffMembers || [];
  const recentLogs = data?.recentLogs || [];
  const stats = data?.stats || {
    totalStaff: 0,
    superAdminCount: 0,
    operatorCount: 0,
    complianceCount: 0,
  };
  const assignedQueues = data?.assignedQueues || {
    pendingApplications: 0,
    pendingPrintShipments: 0,
    failedPayments: 0,
    pendingReviews: 0,
  };

  const filteredStaff = staffMembers.filter((s: any) => {
    if (selectedRole !== "all" && s.role !== selectedRole) return false;
    return true;
  });

  const filteredLogs = selectedOperatorForAudit
    ? recentLogs.filter((l: any) => l.operator?.toLowerCase().includes(selectedOperatorForAudit.toLowerCase()))
    : recentLogs;

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Çoklu Operatör & Personel Masası
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Zero-Trust RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Yetki matrisi, ekip dizini, bireysel operatör hareket denetimi ve görev dağılımı.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Operatör Ekle</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Toplam Ekip</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
            {stats.totalStaff}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tüm birimler</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Süper Yönetici</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-purple-500">
            {stats.superAdminCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tam sistem yetkisi</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Operasyon Uzmanı</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-emerald-500">
            {stats.operatorCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Esnaf onay & triyaj</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Kalite & Uyum (Compliance)</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-amber-500">
            {stats.complianceCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Yorum & denetim</p>
        </div>
      </div>

      {/* Role Matrix Explanation Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Esnafça HQ Yetki & Rol Matrisi</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-purple-600 dark:text-purple-400 block mb-1">
              SUPER_ADMIN
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Finans masası, iade (refund), personel ekleme/çıkarma ve tüm silme operasyonları dahil sınırsız yetki.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block mb-1">
              OPERATOR
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Esnaf başvurusu onay/red, derin düzenleyici ile menü düzenleme, randevu takibi ve toplu WhatsApp duyurusu.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 block mb-1">
              COMPLIANCE
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Müşteri yorum moderasyonu, platform güvenilirlik denetimi ve şikayetli dükkan incelemeleri.
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Tasks & Active Queues Section */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Atanmış Görevler & Canlı Operasyon Kuyrukları
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            Kadro Bazlı İş Yükü
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/applications"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-500 transition-colors">
                Bekleyen Başvuru Onayları
              </span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {assignedQueues.pendingApplications}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sorumlu: OPERATOR</p>
          </Link>

          <Link
            href="/admin/logistics"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-amber-500 transition-colors">
                Baskı Bekleyen Pleksi Stand
              </span>
              <Truck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {assignedQueues.pendingPrintShipments}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sorumlu: OPERATOR</p>
          </Link>

          <Link
            href="/admin/finance"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-rose-500 transition-colors">
                Kurtarma Bekleyen Tahsilatlar
              </span>
              <CreditCard className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {assignedQueues.failedPayments}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sorumlu: SUPER_ADMIN</p>
          </Link>

          <Link
            href="/admin/reviews"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-500 transition-colors">
                Doğrulama Bekleyen Yorumlar
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {assignedQueues.pendingReviews}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sorumlu: COMPLIANCE</p>
          </Link>
        </div>
      </div>

      {/* Main Split View: Staff Directory & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Staff Directory (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Personel & Operatör Dizini
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
              {["all", "SUPER_ADMIN", "OPERATOR", "COMPLIANCE"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    selectedRole === r
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {r === "all" ? "Tümü" : r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredStaff.map((member: any) => (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {member.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          member.role === "SUPER_ADMIN"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : member.role === "OPERATOR"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {member.role}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        title={member.status === "ACTIVE" ? "Aktif" : "İzinde"}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {member.title}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{member.email}</span>
                      </span>
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOperatorForAudit(
                        selectedOperatorForAudit === member.name ? null : member.name
                      );
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedOperatorForAudit === member.name
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Hareketleri Gör
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(member.id, member.status)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={member.status === "ACTIVE" ? "İzne Çıkar" : "Aktife Al"}
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Operator Audit Activities (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-500" />
              <span>Operatör Hareket Kütüğü</span>
            </h2>

            {selectedOperatorForAudit && (
              <button
                type="button"
                onClick={() => setSelectedOperatorForAudit(null)}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Filtreyi Temizle ({selectedOperatorForAudit})
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs max-h-[600px] overflow-y-auto space-y-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {log.operator}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Hedef: #{log.targetId.slice(-6)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                Filtreye uygun işlem bulunamadı.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Yeni Ekip Üyesi / Operatör Ekle
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Canan Kurtuluş"
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Kurumsal E-posta (@achord.io) *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="canan@achord.io"
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Telefon:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="053..."
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Görev / Unvan:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Kıdemli Operasyon Uzmanı"
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Sistem Rolü:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="OPERATOR">OPERATOR (Onay & Düzenleme)</option>
                  <option value="COMPLIANCE">COMPLIANCE (Yorum & Denetim)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Tam Yetki & Finans)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleCreateStaff}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              >
                {submitting ? "Kaydediliyor..." : "Operatörü Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
