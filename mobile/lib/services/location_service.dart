import 'dart:math';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';

class LocationService {
  final Dio _dio = Dio();

  /// Requests hardware GPS position with native OS permission dialog
  Future<Position?> getCurrentPosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return null;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (e) {
      return null;
    }
  }

  /// Reverse geocode via Backend API
  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lon) async {
    try {
      final response = await _dio.get('${ApiConstants.locate}?lat=$lat&lon=$lon');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data;
      }
    } catch (e) {
      // Fallback
    }
    return null;
  }

  /// IP Fallback when GPS is unavailable
  Future<Map<String, dynamic>?> getIpLocation() async {
    try {
      final response = await _dio.get('${ApiConstants.locate}?auto=1');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data;
      }
    } catch (e) {
      // Fallback
    }
    return null;
  }

  /// Haversine Distance in Meters
  static double getDistanceInMeters(double lat1, double lon1, double lat2, double lon2) {
    const double r = 6371000; // Earth radius in meters
    final double phi1 = lat1 * pi / 180;
    final double phi2 = lat2 * pi / 180;
    final double deltaPhi = (lat2 - lat1) * pi / 180;
    final double deltaLambda = (lon2 - lon1) * pi / 180;

    final double a = sin(deltaPhi / 2) * sin(deltaPhi / 2) +
        cos(phi1) * cos(phi2) * sin(deltaLambda / 2) * sin(deltaLambda / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return r * c;
  }

  /// Format distance string and walking duration
  static String formatDistance(double meters) {
    if (meters < 1000) {
      final int walkMin = max(1, (meters / 80).round());
      return '${meters.round()} m · $walkMin dk yürüme';
    } else {
      final double km = meters / 1000;
      return '${km.toStringAsFixed(1)} km';
    }
  }
}
