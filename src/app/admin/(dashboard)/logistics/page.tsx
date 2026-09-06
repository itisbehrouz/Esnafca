"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Printer,
  PackageCheck,
  Clock,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  getAdminLogisticsData,
  updateLogisticsStatusAction,
  createStandShipmentAction,
} from "@/app/actions/admin";
import { PrintableQrStandModal } from "@/components/admin/PrintableQrStandModal";

export default function AdminLogisticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [selectedMerchantForQr, setSelectedMerchantForQr] = useState<any>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Status update modal
  const [statusModalShipment, setStatusModalShipment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("PRINTING");
  const [carrier, setCarrier] = useState<string>("Yurtiçi Kargo");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Create shipment modal
  const [createModalMerchant, setCreateModalMerchant] = useState<any>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const res = await getAdminLogisticsData();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStatus = async () => {
    if (!statusModalShipment) return;
    setUpdating(true);
    try {
      const res = await updateLogisticsStatusAction(
        statusModalShipment.id,
        newStatus as any,
        carrier,
        trackingNumber,
        notes
      );
      if (res.success) {
        showToast(`Sevkiyat durumu "${newStatus}" olarak güncellendi.`);
        setStatusModalShipment(null);
        loadData();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("İşlem başarısız.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!createModalMerchant) return;
    setCreating(true);
    try {
      const res = await createStandShipmentAction(
        createModalMerchant.id,
        recipientName || createModalMerchant.masterName,
        recipientPhone || createModalMerchant.phone,
        shippingAddress || createModalMerchant.address
      );
      if (res.success) {
        showToast("Pleksi stand sevkiyat siparişi oluşturuldu.");
        setCreateModalMerchant(null);
        loadData();
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Sipariş oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Lojistik & Akrilik Stand Masası Yükleniyor...</span>
      </div>
    );
  }

  const shipments = data?.shipments || [];
  const eligibleWithoutStand = data?.eligibleWithoutStand || [];
  const metrics = data?.metrics || {
    totalShipments: 0,
    pendingPrintCount: 0,
    printingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
  };

  const filteredShipments = shipments.filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.recipientName?.toLowerCase().includes(q) ||
      s.merchant?.name?.toLowerCase().includes(q) ||
      s.trackingNumber?.toLowerCase().includes(q) ||
      s.merchant?.district?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Fiziki Akrilik QR Stand & Lojistik Masası
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Baskı & Kargo Takip
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Doğrulanmış ve Pro/Plus esnaflara gönderilen pleksi sayaç QR standları, kargo takip kodları ve vektör baskı şablonları.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            loadData();
          }}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors active:scale-[0.98] w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${refreshing ? "animate-spin" : ""}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Baskı Bekleyen</span>
            <Printer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-amber-500">
            {metrics.pendingPrintCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Matbaaya gönderilecek</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Baskıda / Hazırlanıyor</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-blue-500">
            {metrics.printingCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Pleksi montajında</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Kargoda</span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-purple-500">
            {metrics.shippedCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Kurye dağıtımında</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Teslim Edildi</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono tabular-nums text-emerald-500">
            {metrics.deliveredCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tezgaha yerleştirildi</p>
        </div>
      </div>

      {/* Eligible Pro Merchants Without Stand Alert */}
      {eligibleWithoutStand.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 block">
                {eligibleWithoutStand.length} Doğrulanmış Esnaf Henüz Stand Siparişi Almamış
              </span>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                Pro ve Plus paket sözleşmesi gereği ücretsiz pleksi QR tezgah kiti gönderilmesi gerekmektedir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const m = eligibleWithoutStand[0];
              setCreateModalMerchant(m);
              setRecipientName(m.masterName || m.name);
              setRecipientPhone(m.phone);
              setShippingAddress(m.address ? `${m.address}, ${m.district} / ${m.city}` : "");
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            Hemen Stand Talebi Aç
          </button>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl overflow-x-auto">
          {["all", "PENDING_PRINT", "PRINTING", "SHIPPED", "DELIVERED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st === "all"
                ? "Tümü"
                : st === "PENDING_PRINT"
                ? "Baskı Bekliyor"
                : st === "PRINTING"
                ? "Baskıda"
                : st === "SHIPPED"
                ? "Kargoda"
                : "Teslim Edildi"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Alıcı, dükkan adı veya takip no ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold">Dükkan & Alıcı Usta</th>
                <th className="py-3 px-4 font-bold">Teslimat Adresi</th>
                <th className="py-3 px-4 font-bold">Kargo Firması & Takip No</th>
                <th className="py-3 px-4 font-bold text-center">Durum</th>
                <th className="py-3 px-4 font-bold text-right">Lojistik İşlemleri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredShipments.length > 0 ? (
                filteredShipments.map((s: any) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {s.merchant?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.recipientName} · {s.recipientPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {s.shippingAddress}
                    </td>

                    <td className="py-3 px-4">
                      {s.carrier ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {s.carrier}
                          </span>
                          <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 text-[11px]">
                            {s.trackingNumber || "Takip No Bekleniyor"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Kargolanmadı</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          s.status === "DELIVERED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : s.status === "SHIPPED"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : s.status === "PRINTING"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {s.status === "DELIVERED"
                          ? "Teslim Edildi"
                          : s.status === "SHIPPED"
                          ? "Kargoda"
                          : s.status === "PRINTING"
                          ? "Baskıda"
                          : "Baskı Bekliyor"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMerchantForQr(s.merchant);
                            setIsQrModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                          title="Stand Baskı Vektörünü İncele & Yazdır"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-500" />
                          <span>Stand Yazdır</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStatusModalShipment(s);
                            setNewStatus(s.status);
                            setCarrier(s.carrier || "Yurtiçi Kargo");
                            setTrackingNumber(s.trackingNumber || "");
                            setNotes(s.notes || "");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all"
                        >
                          Durum Güncelle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Sevkiyat kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable QR Stand Modal */}
      <PrintableQrStandModal
        merchant={selectedMerchantForQr}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Update Shipment Status Modal */}
      {statusModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Sevkiyat Durumunu Güncelle
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalShipment(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Esnaf & Alıcı:
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {statusModalShipment.merchant?.name} ({statusModalShipment.recipientName})
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Yeni Durum:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="PENDING_PRINT">Baskı Bekliyor</option>
                  <option value="PRINTING">Baskıda / Atölyede Hazırlanıyor</option>
                  <option value="SHIPPED">Kargoya Verildi (Yolda)</option>
                  <option value="DELIVERED">Teslim Edildi</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Kargo Taşıyıcı Firma:
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                  <option value="Aras Kargo">Aras Kargo</option>
                  <option value="MNG Kargo">MNG Kargo</option>
                  <option value="Kolay Gelsin">Kolay Gelsin</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Kargo Takip Numarası:
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Örn: YK987654321"
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Operasyon Notu:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Koli içeriği veya teslimat notu..."
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalShipment(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={handleUpdateStatus}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              >
                {updating ? "Güncelleniyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Stand Shipment Modal */}
      {createModalMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Yeni Pleksi Stand Talebi Aç
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalMerchant(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Esnaf Adı:
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {createModalMerchant.name}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Alıcı Usta:
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Telefon:
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Teslimat Adresi:
                </label>
                <textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalMerchant(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={creating}
                onClick={handleCreateShipment}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              >
                {creating ? "Açılıyor..." : "Stand Talebini Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
