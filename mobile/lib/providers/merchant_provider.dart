import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/merchant.dart';
import '../services/api_service.dart';
import 'location_provider.dart';

class MerchantFilterState {
  final String categoryId;
  final String searchQuery;
  final bool onlyVerified;
  final bool onlyOpen;
  final bool onlyPlus;

  MerchantFilterState({
    this.categoryId = "all",
    this.searchQuery = "",
    this.onlyVerified = false,
    this.onlyOpen = false,
    this.onlyPlus = false,
  });

  MerchantFilterState copyWith({
    String? categoryId,
    String? searchQuery,
    bool? onlyVerified,
    bool? onlyOpen,
    bool? onlyPlus,
  }) {
    return MerchantFilterState(
      categoryId: categoryId ?? this.categoryId,
      searchQuery: searchQuery ?? this.searchQuery,
      onlyVerified: onlyVerified ?? this.onlyVerified,
      onlyOpen: onlyOpen ?? this.onlyOpen,
      onlyPlus: onlyPlus ?? this.onlyPlus,
    );
  }
}

class MerchantFilterNotifier extends StateNotifier<MerchantFilterState> {
  MerchantFilterNotifier() : super(MerchantFilterState());

  void setCategory(String categoryId) {
    state = state.copyWith(categoryId: categoryId);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void toggleOnlyVerified() {
    state = state.copyWith(onlyVerified: !state.onlyVerified);
  }

  void toggleOnlyOpen() {
    state = state.copyWith(onlyOpen: !state.onlyOpen);
  }

  void toggleOnlyPlus() {
    state = state.copyWith(onlyPlus: !state.onlyPlus);
  }
}

final merchantFilterProvider = StateNotifierProvider<MerchantFilterNotifier, MerchantFilterState>((ref) {
  return MerchantFilterNotifier();
});

final merchantsListProvider = FutureProvider<List<Merchant>>((ref) async {
  final apiService = ApiService();
  final location = ref.watch(locationProvider);
  final filter = ref.watch(merchantFilterProvider);

  List<Merchant> merchants = await apiService.getMerchants(
    city: location.selectedCity,
    district: location.selectedDistrict,
    category: filter.categoryId,
    query: filter.searchQuery,
  );

  // If selected district has no merchants yet, fetch all to display closest craftsmen
  if (merchants.isEmpty && location.selectedDistrict != 'Tüm Bölgeler') {
    merchants = await apiService.getMerchants(
      category: filter.categoryId,
      query: filter.searchQuery,
    );
  }

  return merchants.where((m) {
    if (filter.onlyVerified && !m.verified) return false;
    if (filter.onlyOpen && !m.isOpenNow) return false;
    if (filter.onlyPlus && m.tier != 'plus') return false;
    return true;
  }).toList();
});
