import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/merchant.dart';
import '../../models/service_item.dart';
import '../../services/api_service.dart';
import '../esnaf_ekle/esnaf_ekle_screen.dart';

class DukkanimScreen extends ConsumerStatefulWidget {
  const DukkanimScreen({super.key});

  @override
  ConsumerState<DukkanimScreen> createState() => _DukkanimScreenState();
}

class _DukkanimScreenState extends ConsumerState<DukkanimScreen> {
  final ApiService _apiService = ApiService();

  // Login State
  final TextEditingController _phoneController = TextEditingController(text: "0212 555 01 01");
  final TextEditingController _otpController = TextEditingController(text: "123456");
  bool _otpSent = false;
  List<Merchant> _demoMerchants = [];
  bool _isLoadingDemo = false;

  // Profile Editor Controllers
  final TextEditingController _heroImageController = TextEditingController();
  final TextEditingController _craftTitleController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  final TextEditingController _weekdaysController = TextEditingController();
  final TextEditingController _saturdayController = TextEditingController();
  final TextEditingController _sundayController = TextEditingController();
  String _selectedCategory = "oto-tamir";

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

  void _syncProfileForm(Merchant merchant) {
    _heroImageController.text = merchant.heroImage;
    _craftTitleController.text = merchant.craftTitle;
    _bioController.text = merchant.bio;
    _selectedCategory = merchant.category;
    _weekdaysController.text = merchant.workingHours['weekdays']?.toString() ?? "09:00 - 19:30";
    _saturdayController.text = merchant.workingHours['saturday']?.toString() ?? "09:00 - 19:00";
    _sundayController.text = merchant.workingHours['sunday']?.toString() ?? "Kapalı";

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

      return Scaffold(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        body: CustomScrollView(
          physics: const BouncingScrollPhysics(),
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
                  onPressed: () {
                    HapticFeedback.mediumImpact();
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
                                color: merchant.tier == "plus" ? AppColors.plusGold.withValues(alpha: 0.15) : AppColors.brand.withValues(alpha: 0.1),
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
                        Divider(height: 0.5, thickness: 0.5, color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight),
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
                                  merchant.isOpenNow ? "Haritada müşterilere 'Açık' görünüyor." : "Arama sonuçlarında 'Kapalı' gösteriliyor.",
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

                  // 2. Fiyat Menüsü Düzenleyici Card
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
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                                            decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.zero, border: InputBorder.none),
                                            onChanged: (val) {
                                              _editableServices[idx] = s.copyWith(minPrice: double.tryParse(val) ?? 0);
                                            },
                                          ),
                                        ),
                                        const Text("₺", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.error),
                                  onPressed: () {
                                    HapticFeedback.lightImpact();
                                    if (_editableServices.length > 1) {
                                      setState(() {
                                        _editableServices.removeAt(idx);
                                      });
                                    }
                                  },
                                ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          height: 46,
                          child: ElevatedButton(
                            onPressed: _isSavingServices
                                ? null
                                : () async {
                                    HapticFeedback.mediumImpact();
                                    setState(() => _isSavingServices = true);
                                    final listData = _editableServices.map((s) => s.toJson()).toList();
                                    final ok = await ref.read(authProvider.notifier).updateServices(listData);
                                    setState(() => _isSavingServices = false);
                                    if (context.mounted && ok) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text("Fiyat tarifesi canlıya alındı!")),
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
                                : const Text("Fiyat Değişikliklerini Kaydet", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 3. Profil Bilgileri & Saatler Card
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

                  // 4. Vitrin & Masa QR Kiti Card
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
                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ],
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
}
