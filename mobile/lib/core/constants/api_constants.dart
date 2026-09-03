class ApiConstants {
  // Configurable at build-time via --dart-define=API_BASE_URL=https://api.esnafca.com/api
  // Default for local development: 127.0.0.1:3005 (iOS simulator) or 10.0.2.2:3005 (Android)
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:3005/api',
  );

  static const String merchants = "$baseUrl/merchants";
  static const String applications = "$baseUrl/applications";
  static const String auth = "$baseUrl/merchants/auth";
  static const String sendOtp = "$baseUrl/merchants/auth/send-otp";
  static const String verifyOtp = "$baseUrl/merchants/auth/verify-otp";
  static const String locate = "$baseUrl/locate";
  static const String profile = "$baseUrl/merchants/profile";
  static const String services = "$baseUrl/merchants/services";
  static const String upload = "$baseUrl/upload";
  static const String paymentsCheckout = "$baseUrl/payments/checkout";
}
