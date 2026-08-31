import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../providers/location_provider.dart';
import '../../providers/merchant_provider.dart';
import '../../widgets/merchant_card.dart';
import '../../widgets/category_chip.dart';
import '../../models/category.dart';
import '../../core/constants/app_colors.dart';
import '../merchant_detail/merchant_detail_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Request Native GPS on startup
    Future.microtask(() {
      ref.read(locationProvider.notifier).locateUser();
    });
  }

  void _flyToLocation(LatLng target, double zoom) {
    _mapController.move(target, zoom);
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);
    final filterState = ref.watch(merchantFilterProvider);
    final merchantsAsync = ref.watch(merchantsListProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final LatLng defaultCenter = locationState.userLocation ?? const LatLng(41.0775, 28.9665);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Stack(
        children: [
          // 1. Map Layer
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: defaultCenter,
              initialZoom: 14.0,
              maxZoom: 18.0,
              minZoom: 6.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.esnafca.app',
              ),

              // Markers Layer (iOS 18 Apple Maps style Pins)
              merchantsAsync.when(
                data: (merchants) {
                  final List<Marker> markers = [];

                  // User Location Radar Dot (iOS GPS Blue Dot)
                  if (locationState.userLocation != null) {
                    markers.add(
                      Marker(
                        point: locationState.userLocation!,
                        width: 44,
                        height: 44,
                        child: Center(
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.brand.withValues(alpha: 0.2),
                                ),
                              ),
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  color: AppColors.brand,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 3.5),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.brand.withValues(alpha: 0.5),
                                      blurRadius: 12,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  // Merchant Pins (Apple Maps Pill Design)
                  for (final m in merchants) {
                    if (m.latitude != null && m.longitude != null) {
                      final isPlus = m.tier == 'plus';
                      markers.add(
                        Marker(
                          point: LatLng(m.latitude!, m.longitude!),
                          width: 90,
                          height: 40,
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.mediumImpact();
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => MerchantDetailScreen(merchant: m),
                                ),
                              );
                            },
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  gradient: isPlus
                                      ? const LinearGradient(
                                          colors: [Color(0xFFFF9F0A), Color(0xFFFFB340)],
                                        )
                                      : const LinearGradient(
                                          colors: [Color(0xFF007AFF), Color(0xFF389BFF)],
                                        ),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    width: 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: (isPlus ? const Color(0xFFFF9F0A) : const Color(0xFF007AFF))
                                          .withValues(alpha: 0.4),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      "${m.minPrice.round()} ₺",
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                    if (isPlus) ...[
                                      const SizedBox(width: 3),
                                      const Icon(Icons.star_rounded, color: Colors.white, size: 13),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }
                  }

                  return MarkerLayer(markers: markers);
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),

          // 2. Top Floating iOS 18 Glass Search & Category Bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // iOS 18 Glass Capsule Search Bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                      child: Container(
                        height: 48,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.glassDark : AppColors.glassLight,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                            width: 0.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.search_rounded,
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                onChanged: (val) {
                                  ref.read(merchantFilterProvider.notifier).setSearchQuery(val);
                                },
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: -0.2,
                                  color: isDark ? Colors.white : Colors.black87,
                                ),
                                decoration: InputDecoration(
                                  hintText: "Usta veya zanaat ara...",
                                  hintStyle: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w400,
                                    letterSpacing: -0.2,
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  ),
                                  border: InputBorder.none,
                                  isDense: true,
                                ),
                              ),
                            ),
                            if (_searchController.text.isNotEmpty)
                              GestureDetector(
                                onTap: () {
                                  _searchController.clear();
                                  ref.read(merchantFilterProvider.notifier).setSearchQuery("");
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: isDark ? Colors.white24 : Colors.black12,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.close_rounded,
                                    size: 14,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Horizontal Category Pills
                  SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      children: [
                        CategoryChip(
                          title: "Tümü",
                          isSelected: filterState.categoryId == "all",
                          onTap: () => ref.read(merchantFilterProvider.notifier).setCategory("all"),
                        ),
                        const SizedBox(width: 8),
                        ...kCategories.map((cat) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: CategoryChip(
                                title: cat.shortName,
                                isSelected: filterState.categoryId == cat.id,
                                onTap: () => ref.read(merchantFilterProvider.notifier).setCategory(cat.id),
                              ),
                            )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Map Controls (Zoom In, Zoom Out, GPS Locate) in Glass Action Stack
          Positioned(
            right: 16,
            top: 180,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Zoom In / Out Group Card
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.glassDark : AppColors.glassLight,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                          width: 0.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Zoom In (+)
                          InkWell(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              final currentZoom = _mapController.camera.zoom;
                              if (currentZoom < 18.0) {
                                _mapController.move(_mapController.camera.center, currentZoom + 1.0);
                              }
                            },
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            child: Container(
                              width: 44,
                              height: 44,
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.add_rounded,
                                size: 22,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                          Divider(
                            height: 0.5,
                            thickness: 0.5,
                            color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                          ),
                          // Zoom Out (-)
                          InkWell(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              final currentZoom = _mapController.camera.zoom;
                              if (currentZoom > 6.0) {
                                _mapController.move(_mapController.camera.center, currentZoom - 1.0);
                              }
                            },
                            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                            child: Container(
                              width: 44,
                              height: 44,
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.remove_rounded,
                                size: 22,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // GPS Locate Button
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.glassDark : AppColors.glassLight,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight,
                          width: 0.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: InkWell(
                        onTap: () async {
                          HapticFeedback.mediumImpact();
                          await ref.read(locationProvider.notifier).locateUser();
                          final loc = ref.read(locationProvider).userLocation;
                          if (loc != null) {
                            _flyToLocation(loc, 15.0);
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Center(
                          child: locationState.isLocating
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand),
                                )
                              : const Icon(
                                  Icons.near_me_rounded,
                                  size: 20,
                                  color: AppColors.brand,
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 4. Draggable Bottom Sheet with Merchants List (iOS 18 Native Sheet)
          DraggableScrollableSheet(
            initialChildSize: 0.28,
            minChildSize: 0.12,
            maxChildSize: 0.85,
            builder: (context, scrollController) {
              return Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.12),
                      blurRadius: 24,
                      offset: const Offset(0, -6),
                    ),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: EdgeInsets.zero,
                  physics: const BouncingScrollPhysics(),
                  children: [
                    // iOS Native Grabber Bar
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(top: 10, bottom: 8),
                        width: 36,
                        height: 5,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white24 : Colors.black12,
                          borderRadius: BorderRadius.circular(2.5),
                        ),
                      ),
                    ),

                    // Header Info
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.cardDark : AppColors.backgroundLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.location_on_rounded, size: 14, color: AppColors.brand),
                                const SizedBox(width: 4),
                                Text(
                                  locationState.selectedDistrict != "Tüm Bölgeler"
                                      ? locationState.selectedDistrict
                                      : "Tüm Bölgeler",
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.2,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          merchantsAsync.when(
                            data: (list) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: AppColors.brand.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                "${list.length} Usta",
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.brand,
                                ),
                              ),
                            ),
                            loading: () => const SizedBox.shrink(),
                            error: (_, __) => const SizedBox.shrink(),
                          ),
                        ],
                      ),
                    ),

                    // Merchants Cards
                    merchantsAsync.when(
                      data: (merchants) {
                        if (merchants.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.all(40),
                            child: Center(
                              child: Text(
                                "Bu kriterlere uygun esnaf bulunamadı.",
                                style: TextStyle(fontSize: 13, color: Colors.grey),
                              ),
                            ),
                          );
                        }

                        return Column(
                          children: merchants
                              .map(
                                (m) => MerchantCard(
                                  merchant: m,
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => MerchantDetailScreen(merchant: m),
                                      ),
                                    );
                                  },
                                ),
                              )
                              .toList(),
                        );
                      },
                      loading: () => const Padding(
                        padding: EdgeInsets.all(40),
                        child: Center(child: CircularProgressIndicator(color: AppColors.brand)),
                      ),
                      error: (err, _) => Padding(
                        padding: const EdgeInsets.all(20),
                        child: Center(child: Text("Hata: $err")),
                      ),
                    ),
                    const SizedBox(height: 70),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
