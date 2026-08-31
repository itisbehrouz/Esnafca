class ApiConstants {
  // In development, change this to your LAN IP or localhost
  // Android Emulator: 10.0.2.2:3005
  // iOS Simulator: localhost:3005
  static const String baseUrl = "http://127.0.0.1:3005/api";

  static const String merchants = "$baseUrl/merchants";
  static const String applications = "$baseUrl/applications";
  static const String auth = "$baseUrl/merchants/auth";
  static const String locate = "$baseUrl/locate";
  static const String profile = "$baseUrl/merchants/profile";
  static const String services = "$baseUrl/merchants/services";
}
