import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../services/location_service.dart';

class LocationState {
  final LatLng? userLocation;
  final String selectedCity;
  final String selectedDistrict;
  final String selectedNeighborhood;
  final bool isLocating;
  final String? errorMessage;

  LocationState({
    this.userLocation,
    this.selectedCity = "Tüm Şehirler",
    this.selectedDistrict = "Tüm Bölgeler",
    this.selectedNeighborhood = "",
    this.isLocating = false,
    this.errorMessage,
  });

  LocationState copyWith({
    LatLng? userLocation,
    String? selectedCity,
    String? selectedDistrict,
    String? selectedNeighborhood,
    bool? isLocating,
    String? errorMessage,
  }) {
    return LocationState(
      userLocation: userLocation ?? this.userLocation,
      selectedCity: selectedCity ?? this.selectedCity,
      selectedDistrict: selectedDistrict ?? this.selectedDistrict,
      selectedNeighborhood: selectedNeighborhood ?? this.selectedNeighborhood,
      isLocating: isLocating ?? this.isLocating,
      errorMessage: errorMessage,
    );
  }
}

class LocationNotifier extends StateNotifier<LocationState> {
  final LocationService _locationService = LocationService();

  LocationNotifier() : super(LocationState());

  /// Locate User via Hardware GPS (with IP fallback)
  Future<void> locateUser() async {
    state = state.copyWith(isLocating: true, errorMessage: null);

    try {
      final position = await _locationService.getCurrentPosition();
      if (position != null) {
        final latLng = LatLng(position.latitude, position.longitude);
        state = state.copyWith(userLocation: latLng);

        final geo = await _locationService.reverseGeocode(position.latitude, position.longitude);
        if (geo != null && geo['success'] == true) {
          state = state.copyWith(
            selectedCity: geo['city'] ?? "İstanbul",
            selectedDistrict: geo['district'] ?? "Tüm Bölgeler",
            isLocating: false,
          );
          return;
        }
      } else {
        // Fallback to IP
        final ipGeo = await _locationService.getIpLocation();
        if (ipGeo != null && ipGeo['success'] == true) {
          if (ipGeo['lat'] != null && ipGeo['lon'] != null) {
            state = state.copyWith(
              userLocation: LatLng(ipGeo['lat'], ipGeo['lon']),
              selectedCity: ipGeo['city'] ?? "İstanbul",
              selectedDistrict: ipGeo['district'] ?? "Tüm Bölgeler",
              isLocating: false,
            );
            return;
          }
        }
      }
    } catch (e) {
      state = state.copyWith(errorMessage: "Konum alınamadı.");
    } finally {
      state = state.copyWith(isLocating: false);
    }
  }

  void setLocation(String city, String district, [String neighborhood = ""]) {
    state = state.copyWith(
      selectedCity: city,
      selectedDistrict: district,
      selectedNeighborhood: neighborhood,
    );
  }

  void clearLocation() {
    state = state.copyWith(
      selectedCity: "Tüm Şehirler",
      selectedDistrict: "Tüm Bölgeler",
      selectedNeighborhood: "",
    );
  }
}

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier();
});
