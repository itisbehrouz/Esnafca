import 'dart:io' show Platform;

class ApiConstants {
  // Configurable at build-time via --dart-define=API_BASE_URL=https://...
  static const String _customBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Dynamic base URL depending on platform or custom environment flag
  static String get baseUrl {
    if (_customBaseUrl.isNotEmpty) {
      return _customBaseUrl;
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3005/api';
    }
    return 'http://127.0.0.1:3005/api';
  }

  static String get merchants => "$baseUrl/merchants";
  static String get applications => "$baseUrl/applications";
  static String get auth => "$baseUrl/merchants/auth";
  static String get sendOtp => "$baseUrl/merchants/auth/send-otp";
  static String get verifyOtp => "$baseUrl/merchants/auth/verify-otp";
  static String get locate => "$baseUrl/locate";
  static String get profile => "$baseUrl/merchants/profile";
  static String get services => "$baseUrl/merchants/services";
  static String get upload => "$baseUrl/upload";
  static String get paymentsCheckout => "$baseUrl/payments/checkout";
  static String get appointments => "$baseUrl/merchants/appointments";
}
