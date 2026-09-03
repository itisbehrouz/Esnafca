import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/merchant.dart';
import '../../models/service_item.dart';
import '../../models/appointment.dart';
import '../../services/api_service.dart';
import '../esnaf_ekle/esnaf_ekle_screen.dart';

class DukkanimScreen extends ConsumerStatefulWidget {
  const DukkanimScreen({super.key});

  @override
  ConsumerState<DukkanimScreen> createState() => _DukkanimScreenState();
}

class _DukkanimScreenState extends ConsumerState<DukkanimScreen> {
  final ApiService _apiService = ApiService();

  // Navigation Tab State
  int _selectedTab = 0; // 0: Randevular, 1: Hizmet & Fiyatlar, 2: Vitrin & Profil

  // Login State
  final TextEditingController _phoneController = TextEditingController(text: "0212 555 01 01");
  final TextEditingController _otpController = TextEditingController(text: "123456");
  bool _otpSent = false;
  List<Merchant> _demoMerchants = [];
  bool _isLoadingDemo = false;

  // Appointments State
  List<Appointment> _appointments = [];
  bool _isLoadingAppointments = false;
  String _appointmentFilter = 'all'; // all, pending, confirmed, completed, cancelled
  bool _hasInitialAppointmentsLoaded = false;

  // Profile Editor Controllers
  final TextEditingController _heroImageController = TextEditingController();
  final TextEditingController _craftTitleController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  final TextEditingController _weekdaysController = TextEditingController();
  final TextEditingController _saturdayController = TextEditingController();
  final TextEditingController _sundayController = TextEditingController();
  String _selectedCategory = "oto-tamir";
  bool _isUploadingPhoto = false;

  // Price Menu Editor State
  List<ServiceItem> _editableServices = [];
  bool _isSavingServices = false;
  bool _isSavingProfile = false;

  @override
  void initState() {
    super.initState();
    _loadDemoAccounts();
  }

  void _loadDemoAccounts() async {
    setState(() => _isLoadingDemo = true);
    final list = await _apiService.getDemoMerchants();
    if (mounted) {
      setState(() {
        _demoMerchants = list;
        _isLoadingDemo = false;
      });
    }
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoadingAppointments = true);
    final list = await _apiService.getAppointments();
    if (mounted) {
      setState(() {
        _appointments = list;
        _isLoadingAppointments = false;
      });
    }
  }

  Future<void> _updateAppointmentStatus(String id, String newStatus) async {
    HapticFeedback.mediumImpact();
    final ok = await _apiService.updateAppointmentStatus(id, newStatus);
    if (ok) {
      await _loadAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus == 'confirmed'
                  ? 'Randevu onaylandı.'
                  : newStatus == 'completed'
                      ? 'Randevu tamamlandı olarak işaretlendi.'
                      : 'Randevu iptal edildi.',
            ),
            backgroundColor: newStatus == 'cancelled' ? AppColors.error : AppColors.success,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Randevu güncellenemedi."), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _openWhatsApp(String phone, String customerName) async {
    HapticFeedback.lightImpact();
    var clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (!clean.startsWith('90')) clean = '90$clean';
    final text = Uri.encodeComponent('Merhaba $customerName, Esnafça üzerinden aldığınız randevu hakkında yazıyorum.');
    final url = Uri.parse('https://wa.me/$clean?text=$text');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("WhatsApp açılamadı.")),
        );
      }
    }
  }

  Future<void> _callCustomer(String phone) async {
    HapticFeedback.lightImpact();
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final url = Uri.parse('tel:$clean');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  Future<void> _pickAndUploadPhoto() async {
    HapticFeedback.lightImpact();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final picker = ImagePicker();

    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              "Vitrin Fotoğrafı Güncelle",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: AppColors.brand),
              title: Text(
                "Galeriden Seç",
                style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w600),
              ),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: AppColors.brand),
              title: Text(
                "Kamera ile Çek",
                style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w600),
              ),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final picked = await picker.pickImage(source: source, imageQuality: 85, maxWidth: 1600);
    if (picked == null) return;

    setState(() => _isUploadingPhoto = true);
    final uploadedUrl = await _apiService.uploadPhoto(File(picked.path));

    if (uploadedUrl != null && uploadedUrl.isNotEmpty) {
      final ok = await ref.read(authProvider.notifier).updateProfile({'heroImage': uploadedUrl});
      if (mounted) {
        if (ok) {
          _heroImageController.text = uploadedUrl;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Vitrin görseli başarıyla güncellendi!"),
              backgroundColor: AppColors.success,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Görsel yüklendi fakat profil kaydedilemedi."),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Görsel yüklenirken bir hata oluştu."),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
    setState(() => _isUploadingPhoto = false);
  }

  void _syncProfileForm(Merchant merchant) {
    if (_heroImageController.text.isEmpty) {
      _heroImageController.text = merchant.heroImage;
    }
    if (_craftTitleController.text.isEmpty) {
      _craftTitleController.text = merchant.craftTitle;
    }
    if (_bioController.text.isEmpty) {
      _bioController.text = merchant.bio;
    }
    _selectedCategory = merchant.category;
    if (_weekdaysController.text.isEmpty) {
      _weekdaysController.text = merchant.workingHours['weekdays']?.toString() ?? "09:00 - 19:30";
    }
    if (_saturdayController.text.isEmpty) {
      _saturdayController.text = merchant.workingHours['saturday']?.toString() ?? "09:00 - 19:00";
    }
    if (_sundayController.text.isEmpty) {
      _sundayController.text = merchant.workingHours['sunday']?.toString() ?? "Kapalı";
    }

    if (_editableServices.isEmpty) {
      _editableServices = List.from(merchant.services);
    }
  }

  void _showQrModal(BuildContext context, Merchant merchant, bool isDark) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              "Vitrin & Masa Standı",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.4,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "Müşterileriniz bu QR kodu okutarak güncel fiyat menünüze ulaşır.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    merchant.name,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Colors.black87),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "Şeffaf Fiyat Menüsü & Usta Bilgisi",
                    style: TextStyle(fontSize: 11.5, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 16),
                  QrImageView(
                    data: "https://esnafca.com/esnaf/${merchant.slug}",
                    version: QrVersions.auto,
                    size: 190.0,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    "esnafca.com",
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.brand),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("QR Standı bağlantısı kopyalandı.")),
                  );
                },
                icon: const Icon(Icons.share_rounded, size: 18, color: Colors.white),
                label: const Text("QR Kitini Paylaş / Yazdır", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // =========================================================
    // 1. AUTHENTICATED MERCHANT DASHBOARD
    // =========================================================
    if (authState.currentMerchant != null) {
      final merchant = authState.currentMerchant!;
      _syncProfileForm(merchant);

      if (!_hasInitialAppointmentsLoaded) {
        _hasInitialAppointmentsLoaded = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _loadAppointments();
        });
      }

      final pendingCount = _appointments.where((a) => a.isPending).length;

      return Scaffold(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        body: RefreshIndicator(
          onRefresh: () async {
            await _loadAppointments();
          },
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            slivers: [
              SliverAppBar.large(
                backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
                elevation: 0,
                title: Text(
                  "Dükkanım",
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.8,
                    fontSize: 28,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.logout_rounded, color: AppColors.error, size: 22),
                    tooltip: "Çıkış Yap",
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      _hasInitialAppointmentsLoaded = false;
                      _appointments.clear();
                      ref.read(authProvider.notifier).logout();
                    },
                  ),
                ],
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // 1. Live Status & Identity Card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                          width: 0.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: AppColors.brand.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(Icons.storefront_rounded, color: AppColors.brand, size: 28),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      merchant.name,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: -0.3,
                                        color: isDark ? Colors.white : Colors.black87,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "${merchant.masterName} · ${merchant.district} / ${merchant.city}",
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: merchant.tier == "plus"
                                      ? AppColors.plusGold.withValues(alpha: 0.15)
                                      : AppColors.brand.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  merchant.tier == "plus" ? "Plus Usta" : "Pro Esnaf",
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: merchant.tier == "plus" ? AppColors.plusGold : AppColors.brand,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Divider(
                            height: 0.5,
                            thickness: 0.5,
                            color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                          ),
                          const SizedBox(height: 16),

                          // Live Open / Closed Switch
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: merchant.isOpenNow ? AppColors.success : AppColors.error,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        merchant.isOpenNow ? "Dükkanınız Canlıda Açık" : "Dükkanınız İzinli / Kapalı",
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : Colors.black87,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    merchant.isOpenNow
                                        ? "Haritada müşterilere 'Açık' görünüyor."
                                        : "Arama sonuçlarında 'Kapalı' gösteriliyor.",
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                              CupertinoSwitch(
                                value: merchant.isOpenNow,
                                activeTrackColor: AppColors.success,
                                onChanged: (val) {
                                  HapticFeedback.lightImpact();
                                  ref.read(authProvider.notifier).toggleOpenStatus();
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 2. Navigation Segmented Bar
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          _buildTabButton(
                            0,
                            "Randevular",
                            Icons.calendar_month_rounded,
                            isDark,
                            badgeCount: pendingCount,
                          ),
                          _buildTabButton(
                            1,
                            "Hizmetler",
                            Icons.receipt_long_rounded,
                            isDark,
                          ),
                          _buildTabButton(
                            2,
                            "Vitrin & Profil",
                            Icons.store_mall_directory_rounded,
                            isDark,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 3. Tab Body
                    if (_selectedTab == 0)
                      _buildAppointmentsTab(context, isDark)
                    else if (_selectedTab == 1)
                      _buildServicesTab(context, isDark)
                    else
                      _buildStorefrontTab(context, merchant, isDark),

                    const SizedBox(height: 80),
                  ]),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // =========================================================
    // 2. UNAUTHENTICATED: LOGIN / DEMO SELECTION VIEW
    // =========================================================
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar.large(
            backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
            elevation: 0,
            title: Text(
              "Esnaf Girişi",
              style: TextStyle(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.8,
                fontSize: 28,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Phone / OTP Login Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                      width: 0.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Esnaf Yönetim Portalı",
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.4,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Dükkanınızı yönetmek için telefon numaranızla giriş yapın.",
                        style: TextStyle(
                          fontSize: 12.5,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Phone Input
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                        decoration: InputDecoration(
                          labelText: "Telefon / WhatsApp Numarası",
                          prefixIcon: const Icon(Icons.phone_rounded, size: 20),
                          filled: true,
                          fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // OTP Input
                      if (_otpSent) ...[
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 4,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                          decoration: InputDecoration(
                            labelText: "6 Haneli Doğrulama Kodu",
                            prefixIcon: const Icon(Icons.pin_rounded, size: 20),
                            filled: true,
                            fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      if (authState.errorMessage != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            authState.errorMessage!,
                            style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: authState.isLoading
                              ? null
                              : () async {
                                  HapticFeedback.mediumImpact();
                                  if (!_otpSent) {
                                    final ok = await ref.read(authProvider.notifier).sendOtp(_phoneController.text);
                                    if (ok) {
                                      setState(() {
                                        _otpSent = true;
                                      });
                                    }
                                  } else {
                                    await ref.read(authProvider.notifier).verifyOtp(
                                          _phoneController.text,
                                          _otpController.text,
                                        );
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.brand,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: authState.isLoading
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text(
                                  _otpSent ? "Panele Giriş Yap" : "WhatsApp ile Giriş Kodu Gönder",
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Fast 1-Tap Demo Accounts Selector
                Text(
                  "HIZLI TEST HESAPLARI (1-DOKUNUŞLA GİRİŞ)",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 10),

                if (_isLoadingDemo)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(strokeWidth: 2)))
                else
                  ..._demoMerchants.map((demo) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.mediumImpact();
                            ref.read(authProvider.notifier).loginWithId(demo.id);
                          },
                          borderRadius: BorderRadius.circular(18),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.surfaceDark : Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                                width: 0.5,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: AppColors.brand.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.storefront_rounded, color: AppColors.brand, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        demo.name,
                                        style: TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : Colors.black87,
                                        ),
                                      ),
                                      Text(
                                        "${demo.masterName} · ${demo.district} / ${demo.city}",
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Text(
                                  "Giriş →",
                                  style: TextStyle(
                                    color: AppColors.brand,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )),

                const SizedBox(height: 16),

                // Register New Merchant Button
                Center(
                  child: TextButton.icon(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const EsnafEkleScreen()),
                      );
                    },
                    icon: const Icon(Icons.add_circle_outline_rounded, size: 18, color: AppColors.brand),
                    label: const Text(
                      "Yeni Bir Dükkan Kaydetmek İstiyorum",
                      style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                ),
                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================
  // SUB-WIDGETS & TAB BUILDERS
  // =========================================================

  Widget _buildTabButton(int index, String label, IconData icon, bool isDark, {int badgeCount = 0}) {
    final isSelected = _selectedTab == index;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() {
            _selectedTab = index;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? AppColors.cardDark : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 17,
                color: isSelected ? AppColors.brand : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? (isDark ? Colors.white : Colors.black87) : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
              ),
              if (badgeCount > 0) ...[
                const SizedBox(width: 5),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: AppColors.error,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    "$badgeCount",
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// 1. Tab: Randevular (Appointments)
  Widget _buildAppointmentsTab(BuildContext context, bool isDark) {
    final filteredAppointments = _appointments.where((a) {
      if (_appointmentFilter == 'all') return true;
      return a.status == _appointmentFilter;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Filter Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              _buildFilterChip("Tümü (${_appointments.length})", 'all', isDark),
              const SizedBox(width: 8),
              _buildFilterChip(
                "Bekleyen (${_appointments.where((a) => a.isPending).length})",
                'pending',
                isDark,
                color: Colors.amber,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                "Onaylanan (${_appointments.where((a) => a.isConfirmed).length})",
                'confirmed',
                isDark,
                color: AppColors.brand,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                "Tamamlanan (${_appointments.where((a) => a.isCompleted).length})",
                'completed',
                isDark,
                color: AppColors.success,
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                "İptaller (${_appointments.where((a) => a.isCancelled).length})",
                'cancelled',
                isDark,
                color: AppColors.error,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (_isLoadingAppointments)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
          )
        else if (filteredAppointments.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                width: 0.5,
              ),
            ),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.brand.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.event_busy_rounded, color: AppColors.brand, size: 28),
                ),
                const SizedBox(height: 14),
                Text(
                  "Randevu Bulunmuyor",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Bu filtreye uygun aktif bir randevu kaydı yok.",
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 16),
                TextButton.icon(
                  onPressed: _loadAppointments,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text("Yenile"),
                ),
              ],
            ),
          )
        else
          ...filteredAppointments.map((apt) => _buildAppointmentCard(context, apt, isDark)),
      ],
    );
  }

  Widget _buildFilterChip(String title, String key, bool isDark, {Color? color}) {
    final isSelected = _appointmentFilter == key;
    final chipColor = color ?? AppColors.brand;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _appointmentFilter = key);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? chipColor.withValues(alpha: 0.15)
              : (isDark ? AppColors.surfaceDark : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? chipColor : (isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight),
            width: isSelected ? 1.5 : 0.5,
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected
                ? chipColor
                : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
          ),
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(BuildContext context, Appointment apt, bool isDark) {
    Color statusColor;
    String statusLabel;

    if (apt.isConfirmed) {
      statusColor = AppColors.brand;
      statusLabel = "Onaylandı";
    } else if (apt.isCompleted) {
      statusColor = AppColors.success;
      statusLabel = "Tamamlandı";
    } else if (apt.isCancelled) {
      statusColor = AppColors.error;
      statusLabel = "İptal Edildi";
    } else {
      statusColor = Colors.amber.shade700;
      statusLabel = "Onay Bekliyor";
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Date / Time + Status Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.brand.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time_rounded, color: AppColors.brand, size: 14),
                    const SizedBox(width: 5),
                    Text(
                      "${apt.date} · ${apt.startTime}${apt.endTime != null ? ' - ${apt.endTime}' : ''}",
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.brand,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Customer info & Price
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.cardDark : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  Icons.person_outline_rounded,
                  color: isDark ? Colors.white70 : Colors.black87,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      apt.customerName,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      apt.customerPhone,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      apt.service?.name ?? "Genel Ziyaret / Randevu",
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.grey.shade300 : Colors.grey.shade800,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                "${apt.price.toInt()} ₺",
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: AppColors.brand,
                ),
              ),
            ],
          ),

          if (apt.customerNote != null && apt.customerNote!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                "Not: ${apt.customerNote}",
                style: TextStyle(
                  fontSize: 11.5,
                  fontStyle: FontStyle.italic,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
            ),
          ],

          const SizedBox(height: 14),
          Divider(
            height: 0.5,
            thickness: 0.5,
            color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
          ),
          const SizedBox(height: 12),

          // Action Buttons: WhatsApp, Call, Status Update
          Row(
            children: [
              // WhatsApp
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _openWhatsApp(apt.customerPhone, apt.customerName),
                  icon: const Icon(Icons.chat_bubble_outline_rounded, size: 14, color: Color(0xFF25D366)),
                  label: const Text(
                    "WhatsApp",
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF25D366)),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    side: BorderSide(color: const Color(0xFF25D366).withValues(alpha: 0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Call
              OutlinedButton(
                onPressed: () => _callCustomer(apt.customerPhone),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Icon(Icons.phone_rounded, size: 15, color: isDark ? Colors.white70 : Colors.black87),
              ),
              const SizedBox(width: 8),

              // Status Change Action
              if (apt.isPending) ...[
                ElevatedButton(
                  onPressed: () => _updateAppointmentStatus(apt.id, 'confirmed'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Onayla", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 4),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.error),
                  tooltip: "İptal Et",
                  onPressed: () => _updateAppointmentStatus(apt.id, 'cancelled'),
                ),
              ] else if (apt.isConfirmed) ...[
                ElevatedButton(
                  onPressed: () => _updateAppointmentStatus(apt.id, 'completed'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Tamamlandı", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 4),
                IconButton(
                  icon: const Icon(Icons.cancel_outlined, size: 18, color: AppColors.error),
                  tooltip: "İptal Et",
                  onPressed: () => _updateAppointmentStatus(apt.id, 'cancelled'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  /// 2. Tab: Fiyat Menüsü Düzenleyici (Services)
  Widget _buildServicesTab(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
          width: 0.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Şeffaf Fiyat Menüsü",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  Text(
                    "Hizmet ve fiyatlarınızı anında güncelleyin.",
                    style: TextStyle(
                      fontSize: 11.5,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
              IconButton.filledTonal(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _editableServices.add(
                      ServiceItem(
                        id: "srv-${DateTime.now().millisecondsSinceEpoch}",
                        name: "Yeni Hizmet",
                        minPrice: 200,
                        maxPrice: 400,
                      ),
                    );
                  });
                },
                icon: const Icon(Icons.add_rounded, size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.brand.withValues(alpha: 0.12),
                  foregroundColor: AppColors.brand,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Service Items List
          ..._editableServices.asMap().entries.map((entry) {
            final idx = entry.key;
            final s = entry.value;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      initialValue: s.name,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                      decoration: const InputDecoration(
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                        border: InputBorder.none,
                        hintText: "Hizmet Adı",
                      ),
                      onChanged: (val) {
                        _editableServices[idx] = s.copyWith(name: val);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              initialValue: s.minPrice.toInt().toString(),
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.right,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.brand),
                              decoration: const InputDecoration(
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                                border: InputBorder.none,
                              ),
                              onChanged: (val) {
                                final p = double.tryParse(val) ?? s.minPrice;
                                _editableServices[idx] = s.copyWith(minPrice: p);
                              },
                            ),
                          ),
                          const Text(" ₺", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.brand)),
                        ],
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.grey),
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _editableServices.removeAt(idx);
                      });
                    },
                  ),
                ],
              ),
            );
          }),

          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              onPressed: _isSavingServices
                  ? null
                  : () async {
                      HapticFeedback.mediumImpact();
                      setState(() => _isSavingServices = true);
                      final listData = _editableServices.map((e) => e.toJson()).toList();
                      final ok = await ref.read(authProvider.notifier).updateServices(listData);
                      setState(() => _isSavingServices = false);
                      if (context.mounted && ok) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Fiyat menünüz canlıda güncellendi.")),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSavingServices
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text("Menüyü Kaydet ve Yayınla", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
            ),
          ),
        ],
      ),
    );
  }

  /// 3. Tab: Vitrin & Profil Düzenleyici
  Widget _buildStorefrontTab(BuildContext context, Merchant merchant, bool isDark) {
    return Column(
      children: [
        // Hero Image Showcase & Native Photo Picker Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
              width: 0.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Vitrin Kapak Görseli",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  if (_isUploadingPhoto)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                "Müşterilerinizin haritada ve arama listesinde göreceği ana görsel.",
                style: TextStyle(
                  fontSize: 11.5,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 14),

              // Image Preview with Camera Action
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: SizedBox(
                      height: 160,
                      width: double.infinity,
                      child: CachedNetworkImage(
                        imageUrl: _heroImageController.text.isNotEmpty
                            ? _heroImageController.text
                            : merchant.heroImage,
                        fit: BoxFit.cover,
                        placeholder: (ctx, url) => Container(
                          color: isDark ? AppColors.cardDark : Colors.grey.shade200,
                          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                        ),
                        errorWidget: (ctx, url, error) => Container(
                          color: isDark ? AppColors.cardDark : Colors.grey.shade200,
                          child: const Icon(Icons.image_not_supported_rounded, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withValues(alpha: 0.1),
                            Colors.black.withValues(alpha: 0.65),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: ElevatedButton.icon(
                      onPressed: _isUploadingPhoto ? null : _pickAndUploadPhoto,
                      icon: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                      label: Text(
                        _isUploadingPhoto ? "Yükleniyor..." : "Fotoğraf Değiştir",
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brand,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Profil Bilgileri & Saatler Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
              width: 0.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Profil Bilgileri & Saatler",
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 14),

              // Kategori Dropdown
              DropdownButtonFormField<String>(
                initialValue: _selectedCategory,
                decoration: InputDecoration(
                  labelText: "Zanaat / Kategori",
                  prefixIcon: const Icon(Icons.category_rounded, size: 20),
                  filled: true,
                  fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
                items: const [
                  DropdownMenuItem(value: "oto-tamir", child: Text("Oto Tamir & Bakım")),
                  DropdownMenuItem(value: "berber", child: Text("Erkek Kuaförü / Berber")),
                  DropdownMenuItem(value: "kadin-kuafor", child: Text("Kadın Kuaförü & Güzellik")),
                  DropdownMenuItem(value: "cilingir", child: Text("Çilingir & Anahtar")),
                  DropdownMenuItem(value: "terzi", child: Text("Terzi & Kuru Temizleme")),
                  DropdownMenuItem(value: "elektrik", child: Text("Elektrikçi & Tesisat")),
                  DropdownMenuItem(value: "tesisat", child: Text("Sıhhi Tesisat & Su")),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCategory = val);
                },
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _craftTitleController,
                style: TextStyle(fontSize: 13, color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  labelText: "Zanaat Sloganı (Örn: OTO BAKIM & MEKANİK)",
                  filled: true,
                  fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _bioController,
                maxLines: 2,
                style: TextStyle(fontSize: 13, color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  labelText: "Biyografi & Usta Notu",
                  filled: true,
                  fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _weekdaysController,
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white : Colors.black87),
                      decoration: InputDecoration(
                        labelText: "Hafta İçi",
                        filled: true,
                        fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _saturdayController,
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white : Colors.black87),
                      decoration: InputDecoration(
                        labelText: "Cumartesi",
                        filled: true,
                        fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _sundayController,
                style: TextStyle(fontSize: 12, color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  labelText: "Pazar",
                  filled: true,
                  fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 14),

              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: _isSavingProfile
                      ? null
                      : () async {
                          HapticFeedback.mediumImpact();
                          setState(() => _isSavingProfile = true);
                          final ok = await ref.read(authProvider.notifier).updateProfile({
                            'category': _selectedCategory,
                            'craftTitle': _craftTitleController.text,
                            'bio': _bioController.text,
                            'workingHours': {
                              'weekdays': _weekdaysController.text,
                              'saturday': _saturdayController.text,
                              'sunday': _sundayController.text,
                            },
                          });
                          setState(() => _isSavingProfile = false);
                          if (context.mounted && ok) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Profil bilgileri güncellendi.")),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isSavingProfile
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text("Profil Bilgilerini Kaydet", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Masa & Vitrin QR Kiti Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF1C1C1E),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Masa & Vitrin QR Kiti",
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    Text(
                      "Müşterileriniz için şık stand kiti",
                      style: TextStyle(fontSize: 11.5, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () => _showQrModal(context, merchant, isDark),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black87,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text("Aç", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
