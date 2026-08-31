import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/location_service.dart';
import '../../services/api_service.dart';
import '../../core/constants/app_colors.dart';

class EsnafEkleScreen extends StatefulWidget {
  const EsnafEkleScreen({super.key});

  @override
  State<EsnafEkleScreen> createState() => _EsnafEkleScreenState();
}

class _EsnafEkleScreenState extends State<EsnafEkleScreen> {
  final LocationService _locationService = LocationService();
  final ApiService _apiService = ApiService();

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _masterController = TextEditingController();
  final _cityController = TextEditingController(text: "İstanbul");
  final _districtController = TextEditingController();
  final _neighborhoodController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _experienceController = TextEditingController(text: "10");

  String _selectedCategory = "oto-tamir";
  String _selectedPlan = "pro"; // free, pro, plus

  // Multi-service list
  final List<Map<String, dynamic>> _services = [
    {"name": "Genel Hizmet & Teşhis", "minPrice": 300.0, "maxPrice": 600.0}
  ];

  bool _isLocating = false;
  bool _isSubmitting = false;
  bool _isSuccess = false;
  double? _lat;
  double? _lon;

  final List<Map<String, String>> _categories = [
    {"id": "oto-tamir", "name": "Oto Tamir & Bakım"},
    {"id": "berber", "name": "Erkek Kuaförü / Berber"},
    {"id": "kadin-kuafor", "name": "Kadın Kuaförü & Güzellik"},
    {"id": "cilingir", "name": "Çilingir & Anahtar"},
    {"id": "terzi", "name": "Terzi & Kuru Temizleme"},
    {"id": "elektrik", "name": "Elektrikçi & Tesisat"},
    {"id": "tesisat", "name": "Sıhhi Tesisat & Su"},
  ];

  void _getGpsLocation() async {
    HapticFeedback.lightImpact();
    setState(() => _isLocating = true);

    try {
      final pos = await _locationService.getCurrentPosition();
      if (pos != null) {
        _lat = pos.latitude;
        _lon = pos.longitude;
        final geo = await _locationService.reverseGeocode(pos.latitude, pos.longitude);
        if (geo != null && geo['success'] == true) {
          setState(() {
            _cityController.text = geo['city'] ?? "İstanbul";
            _districtController.text = geo['district'] ?? "";
            _neighborhoodController.text = geo['neighborhood'] ?? "";
            _addressController.text = "${geo['neighborhood'] ?? ''} Mah. ${geo['district'] ?? ''} / ${geo['city'] ?? 'İstanbul'}";
          });
        }
      }
    } finally {
      setState(() => _isLocating = false);
    }
  }

  void _submit() async {
    HapticFeedback.mediumImpact();
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final appData = {
      'name': _nameController.text,
      'masterName': _masterController.text,
      'category': _selectedCategory,
      'experienceYears': int.tryParse(_experienceController.text) ?? 5,
      'city': _cityController.text,
      'district': _districtController.text,
      'neighborhood': _neighborhoodController.text,
      'address': _addressController.text.isNotEmpty
          ? _addressController.text
          : "${_neighborhoodController.text}, ${_districtController.text} / ${_cityController.text}",
      'phone': _phoneController.text,
      'whatsapp': _phoneController.text,
      'plan': _selectedPlan,
      'latitude': _lat,
      'longitude': _lon,
      'services': _services,
    };

    final ok = await _apiService.submitApplication(appData);
    setState(() {
      _isSubmitting = false;
      _isSuccess = ok;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isSuccess) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_rounded, color: AppColors.success, size: 44),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    "Başvurunuz Alındı!",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.4,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Esnafça editör onayı sonrasında dükkanınız ve fiyat tarifeniz haritada aktifleşecektir.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brand,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text("Tamam", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar.large(
            backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
            elevation: 0,
            title: Text(
              "Esnaf Ol",
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
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // 1. GPS Auto-Fill Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : Colors.white,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                            width: 0.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.brand.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.near_me_rounded, color: AppColors.brand, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "GPS ile Otomatik Konum",
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                  Text(
                                    "İl, ilçe ve mahalleniz otomatik bulunur.",
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: _isLocating ? null : _getGpsLocation,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brand,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: _isLocating
                                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text("Konum Al", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 2. Dükkan & Usta Bilgileri Card
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
                              "Dükkan Bilgileri",
                              style: TextStyle(
                                fontSize: 16,
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
                              items: _categories.map((c) {
                                return DropdownMenuItem<String>(
                                  value: c['id'],
                                  child: Text(c['name']!, style: const TextStyle(fontSize: 13)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedCategory = val);
                              },
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _nameController,
                              style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                              decoration: InputDecoration(
                                labelText: "Dükkan Adı (Örn: Maslak Oto Servis)",
                                prefixIcon: const Icon(Icons.storefront_rounded, size: 20),
                                filled: true,
                                fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                              ),
                              validator: (v) => v == null || v.isEmpty ? "Zorunlu alan" : null,
                            ),
                            const SizedBox(height: 12),

                            Row(
                              children: [
                                Expanded(
                                  flex: 3,
                                  child: TextFormField(
                                    controller: _masterController,
                                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                                    decoration: InputDecoration(
                                      labelText: "Usta Adı & Soyadı",
                                      prefixIcon: const Icon(Icons.person_rounded, size: 20),
                                      filled: true,
                                      fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                                    ),
                                    validator: (v) => v == null || v.isEmpty ? "Zorunlu" : null,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  flex: 2,
                                  child: TextFormField(
                                    controller: _experienceController,
                                    keyboardType: TextInputType.number,
                                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                                    decoration: InputDecoration(
                                      labelText: "Deneyim (Yıl)",
                                      filled: true,
                                      fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _cityController,
                                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                                    decoration: InputDecoration(
                                      labelText: "Şehir (İl)",
                                      filled: true,
                                      fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                                    ),
                                    validator: (v) => v == null || v.isEmpty ? "Zorunlu" : null,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: TextFormField(
                                    controller: _districtController,
                                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                                    decoration: InputDecoration(
                                      labelText: "İlçe",
                                      filled: true,
                                      fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                                    ),
                                    validator: (v) => v == null || v.isEmpty ? "Zorunlu" : null,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _neighborhoodController,
                              style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                              decoration: InputDecoration(
                                labelText: "Mahalle / Semt",
                                filled: true,
                                fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                              ),
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
                              decoration: InputDecoration(
                                labelText: "Telefon / WhatsApp Numarası",
                                prefixIcon: const Icon(Icons.phone_rounded, size: 20),
                                filled: true,
                                fillColor: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                              ),
                              validator: (v) => v == null || v.isEmpty ? "Zorunlu alan" : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 3. Paket Planı Seçimi
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
                              "Abonelik Planı",
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.3,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                _buildPlanOption("free", "Mahalleli", "Ücretsiz", isDark),
                                const SizedBox(width: 8),
                                _buildPlanOption("pro", "Esnafça Pro", "499 ₺/ay", isDark),
                                const SizedBox(width: 8),
                                _buildPlanOption("plus", "Usta Plus", "999 ₺/ay", isDark),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4. Hizmetler & Fiyat Menüsü Card
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
                                  "Hizmet & Fiyat Menüsü",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                                IconButton.filledTonal(
                                  onPressed: () {
                                    HapticFeedback.lightImpact();
                                    setState(() {
                                      _services.add({"name": "Yeni Hizmet", "minPrice": 200.0, "maxPrice": 400.0});
                                    });
                                  },
                                  icon: const Icon(Icons.add_rounded, size: 18),
                                  style: IconButton.styleFrom(
                                    backgroundColor: AppColors.brand.withValues(alpha: 0.12),
                                    foregroundColor: AppColors.brand,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            ..._services.asMap().entries.map((entry) {
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
                                        initialValue: s['name'],
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                                        decoration: const InputDecoration(
                                          isDense: true,
                                          contentPadding: EdgeInsets.zero,
                                          border: InputBorder.none,
                                          hintText: "Hizmet Adı",
                                        ),
                                        onChanged: (val) => _services[idx]['name'] = val,
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
                                                initialValue: s['minPrice'].toInt().toString(),
                                                keyboardType: TextInputType.number,
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                                                decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.zero, border: InputBorder.none),
                                                onChanged: (val) => _services[idx]['minPrice'] = double.tryParse(val) ?? 0,
                                              ),
                                            ),
                                            const Text("₺", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                                          ],
                                        ),
                                      ),
                                    ),
                                    if (_services.length > 1) ...[
                                      const SizedBox(width: 6),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.error),
                                        onPressed: () {
                                          HapticFeedback.lightImpact();
                                          setState(() => _services.removeAt(idx));
                                        },
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.brand,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text(
                                  "Dükkanımı Kaydet & Onaya Gönder",
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                        ),
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanOption(String planId, String title, String price, bool isDark) {
    final isSelected = _selectedPlan == planId;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _selectedPlan = planId);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? (planId == 'plus' ? AppColors.plusGold.withValues(alpha: 0.15) : AppColors.brand.withValues(alpha: 0.12))
                : (isDark ? AppColors.cardDark : AppColors.backgroundLight),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected
                  ? (planId == 'plus' ? AppColors.plusGold : AppColors.brand)
                  : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Column(
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isSelected
                      ? (planId == 'plus' ? AppColors.plusGold : AppColors.brand)
                      : (isDark ? Colors.white : Colors.black87),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                price,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
