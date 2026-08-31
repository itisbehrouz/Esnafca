import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';
import '../models/merchant.dart';

class ApiService {
  final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  /// Fetch Merchants with optional filters
  Future<List<Merchant>> getMerchants({
    String? city,
    String? district,
    String? category,
    String? query,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (city != null && city != 'Tüm Şehirler') queryParams['city'] = city;
      if (district != null && district != 'Tüm Bölgeler') queryParams['district'] = district;
      if (category != null && category != 'all') queryParams['category'] = category;
      if (query != null && query.isNotEmpty) queryParams['q'] = query;

      final response = await _dio.get(
        ApiConstants.merchants,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((json) => Merchant.fromJson(json)).toList();
      }
    } catch (e) {
      // Error fetching merchants
    }
    return [];
  }

  /// Fetch Single Merchant by Slug
  Future<Merchant?> getMerchantBySlug(String slug) async {
    try {
      final response = await _dio.get('${ApiConstants.merchants}/$slug');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return Merchant.fromJson(response.data['data']);
      }
    } catch (e) {
      // Error fetching merchant
    }
    return null;
  }

  /// Get Demo Merchants for 1-Tap Fast Login
  Future<List<Merchant>> getDemoMerchants() async {
    try {
      final response = await _dio.get(ApiConstants.auth);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> list = response.data['data'] ?? [];
        return list.map((j) => Merchant.fromJson(j)).toList();
      }
    } catch (e) {
      // Error fetching demo merchants
    }
    return [];
  }

  /// Submit Merchant Application (Esnaf Ekle)
  Future<bool> submitApplication(Map<String, dynamic> appData) async {
    try {
      final response = await _dio.post(
        ApiConstants.applications,
        data: appData,
      );
      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  /// Authenticate Merchant by Phone
  Future<Map<String, dynamic>?> loginByPhone(String phone, String otp) async {
    try {
      final response = await _dio.post(
        ApiConstants.auth,
        data: {'phone': phone, 'otp': otp},
      );
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      // Error authenticating
    }
    return null;
  }

  /// Direct Login by Merchant ID (Fast Demo Login)
  Future<Merchant?> loginById(String id) async {
    try {
      final response = await _dio.post(
        ApiConstants.auth,
        data: {'id': id},
      );
      if (response.statusCode == 200 && response.data['success'] == true && response.data['merchant'] != null) {
        return Merchant.fromJson(response.data['merchant']);
      }
    } catch (e) {
      // Error logging in by id
    }
    return null;
  }

  /// Update Merchant Profile (Name, Bio, Slogan, Hero Image, Working Hours, etc.)
  Future<Merchant?> updateProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _dio.patch(
        ApiConstants.profile,
        data: profileData,
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        return Merchant.fromJson(response.data['data']);
      }
    } catch (e) {
      // Error updating profile
    }
    return null;
  }

  /// Toggle Open / Closed Status Live
  Future<bool> toggleOpenStatus(String merchantId, bool isOpenNow) async {
    try {
      final response = await _dio.patch(
        ApiConstants.profile,
        data: {'id': merchantId, 'isOpenNow': isOpenNow},
      );
      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  /// Update Merchant Services & Price Menu
  Future<Merchant?> updateServices(String merchantId, List<Map<String, dynamic>> services) async {
    try {
      final response = await _dio.post(
        ApiConstants.services,
        data: {'merchantId': merchantId, 'services': services},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        return Merchant.fromJson(response.data['data']);
      }
    } catch (e) {
      // Error updating services
    }
    return null;
  }
}
