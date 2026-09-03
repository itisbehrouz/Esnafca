import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/api_constants.dart';
import '../models/merchant.dart';
import '../models/appointment.dart';

class ApiService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  late final Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Request interceptor to automatically attach JWT token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
      ),
    );
  }

  /// Fetch Merchants with optional filters
  Future<List<Merchant>> getMerchants({
    String? city,
    String? district,
    String? category,
    String? query,
    int? page,
    int? limit,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (city != null && city != 'Tüm Şehirler') queryParams['city'] = city;
      if (district != null && district != 'Tüm Bölgeler') queryParams['district'] = district;
      if (category != null && category != 'all') queryParams['category'] = category;
      if (query != null && query.isNotEmpty) queryParams['q'] = query;
      if (page != null) queryParams['page'] = page;
      if (limit != null) queryParams['limit'] = limit;

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

  /// Step 1: Send SMS / WhatsApp OTP
  Future<Map<String, dynamic>?> sendOtp(String phone) async {
    try {
      final response = await _dio.post(
        ApiConstants.sendOtp,
        data: {'phone': phone},
      );
      return response.data;
    } on DioException catch (e) {
      return e.response?.data;
    } catch (e) {
      return {'success': false, 'error': 'Sunucu bağlantı hatası.'};
    }
  }

  /// Step 2: Verify OTP and save JWT token
  Future<Map<String, dynamic>?> verifyOtp(String phone, String code) async {
    try {
      final response = await _dio.post(
        ApiConstants.verifyOtp,
        data: {'phone': phone, 'code': code},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        final token = response.data['token'];
        if (token != null) {
          await _storage.write(key: 'auth_token', value: token);
        }
      }
      return response.data;
    } on DioException catch (e) {
      return e.response?.data;
    } catch (e) {
      return {'success': false, 'error': 'Doğrulama işlemi başarısız.'};
    }
  }

  /// Update Merchant Profile (JWT Protected)
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
  Future<bool> toggleOpenStatus(bool isOpenNow) async {
    try {
      final response = await _dio.patch(
        ApiConstants.profile,
        data: {'isOpenNow': isOpenNow},
      );
      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  /// Update Merchant Services & Price Menu (JWT Protected)
  Future<Merchant?> updateServices(List<Map<String, dynamic>> services) async {
    try {
      final response = await _dio.post(
        ApiConstants.services,
        data: {'services': services},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        return Merchant.fromJson(response.data['data']);
      }
    } catch (e) {
      // Error updating services
    }
    return null;
  }

  /// Fetch Current Merchant Profile (JWT Protected)
  Future<Merchant?> getProfile() async {
    try {
      final response = await _dio.get(ApiConstants.profile);
      if (response.statusCode == 200 && response.data['success'] == true) {
        return Merchant.fromJson(response.data['data']);
      }
    } catch (e) {
      // Error fetching profile
    }
    return null;
  }

  /// Fast Demo Login by ID
  Future<Map<String, dynamic>?> loginById(String id) async {
    try {
      final response = await _dio.post(
        ApiConstants.auth,
        data: {'id': id},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        final token = response.data['token'];
        if (token != null) {
          await _storage.write(key: 'auth_token', value: token);
        }
      }
      return response.data;
    } on DioException catch (e) {
      return e.response?.data;
    } catch (e) {
      return {'success': false, 'error': 'Giriş yapılamadı.'};
    }
  }

  /// Fetch Appointments for Logged-In Merchant (JWT Protected)
  Future<List<Appointment>> getAppointments({String? date}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (date != null && date.isNotEmpty) {
        queryParams['date'] = date;
      }
      final response = await _dio.get(
        ApiConstants.appointments,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> list = response.data['data'] ?? [];
        return list.map((item) => Appointment.fromJson(item)).toList();
      }
    } catch (e) {
      // Error fetching appointments
    }
    return [];
  }

  /// Update Appointment Status (JWT Protected)
  Future<bool> updateAppointmentStatus(String appointmentId, String status) async {
    try {
      final response = await _dio.patch(
        ApiConstants.appointments,
        data: {
          'appointmentId': appointmentId,
          'status': status,
        },
      );
      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  /// Upload Photo using Native Multipart FormData
  Future<String?> uploadPhoto(File file) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await _dio.post(
        ApiConstants.upload,
        data: formData,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['url'] as String?;
      }
    } catch (e) {
      // Error uploading photo
    }
    return null;
  }

  /// Clear token on logout
  Future<void> clearAuth() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'merchant_id');
  }
}
