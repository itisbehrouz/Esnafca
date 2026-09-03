import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/merchant.dart';
import '../services/api_service.dart';

class AuthState {
  final Merchant? currentMerchant;
  final bool isLoading;
  final String? status; // "approved", "pending", "rejected", null
  final String? errorMessage;
  final bool isOtpSent;
  final String? pendingPhone;
  final bool isAuthenticated;

  AuthState({
    this.currentMerchant,
    this.isLoading = false,
    this.status,
    this.errorMessage,
    this.isOtpSent = false,
    this.pendingPhone,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    Merchant? currentMerchant,
    bool? isLoading,
    String? status,
    String? errorMessage,
    bool? isOtpSent,
    String? pendingPhone,
    bool? isAuthenticated,
  }) {
    return AuthState(
      currentMerchant: currentMerchant ?? this.currentMerchant,
      isLoading: isLoading ?? this.isLoading,
      status: status ?? this.status,
      errorMessage: errorMessage,
      isOtpSent: isOtpSent ?? this.isOtpSent,
      pendingPhone: pendingPhone ?? this.pendingPhone,
      isAuthenticated: isAuthenticated ?? (currentMerchant != null ? true : this.isAuthenticated),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthNotifier() : super(AuthState()) {
    _initSession();
  }

  /// Rehydrate session from stored JWT token on app launch
  Future<void> _initSession() async {
    state = state.copyWith(isLoading: true);
    final token = await _storage.read(key: 'auth_token');
    if (token != null && token.isNotEmpty) {
      final profile = await _apiService.getProfile();
      if (profile != null) {
        await _storage.write(key: 'merchant_id', value: profile.id);
        state = state.copyWith(
          currentMerchant: profile,
          isAuthenticated: true,
          status: 'approved',
          isLoading: false,
        );
        return;
      }
    }
    state = state.copyWith(isLoading: false);
  }

  /// 1-Tap Fast Demo Login by Merchant ID
  Future<bool> loginWithId(String id) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _apiService.loginById(id);
      if (res != null && res['success'] == true) {
        if (res['merchant'] != null) {
          final merchant = Merchant.fromJson(res['merchant']);
          await _storage.write(key: 'merchant_id', value: merchant.id);
          state = state.copyWith(
            currentMerchant: merchant,
            isAuthenticated: true,
            status: 'approved',
            isLoading: false,
          );
          return true;
        }
      }
      state = state.copyWith(
        isLoading: false,
        errorMessage: res?['error'] ?? "Giriş yapılamadı.",
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: "Giriş sırasında hata oluştu.",
      );
      return false;
    }
  }

  /// Step 1: Send OTP to phone
  Future<bool> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final res = await _apiService.sendOtp(phone);
      if (res != null && res['success'] == true) {
        state = state.copyWith(
          isLoading: false,
          isOtpSent: true,
          pendingPhone: phone,
          status: res['status'],
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: res?['error'] ?? "Doğrulama kodu gönderilemedi.",
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: "Sunucu bağlantı hatası.",
      );
      return false;
    }
  }

  /// Step 2: Verify OTP and Login
  Future<bool> verifyOtp(String phone, String code) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final res = await _apiService.verifyOtp(phone, code);
      if (res != null && res['success'] == true) {
        if (res['status'] == 'approved' && res['merchant'] != null) {
          final merchant = Merchant.fromJson(res['merchant']);
          await _storage.write(key: 'merchant_id', value: merchant.id);
          state = state.copyWith(
            currentMerchant: merchant,
            isAuthenticated: true,
            status: 'approved',
            isLoading: false,
            isOtpSent: false,
          );
          return true;
        } else {
          state = state.copyWith(
            status: res['status'],
            errorMessage: res['message'],
            isLoading: false,
          );
          return false;
        }
      } else {
        state = state.copyWith(
          errorMessage: res?['error'] ?? "Geçersiz doğrulama kodu.",
          isLoading: false,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        errorMessage: "Doğrulama sırasında hata oluştu.",
        isLoading: false,
      );
      return false;
    }
  }

  /// Reset OTP State
  void resetOtpState() {
    state = state.copyWith(isOtpSent: false, errorMessage: null);
  }

  /// Toggle Open / Closed Status
  Future<void> toggleOpenStatus() async {
    if (state.currentMerchant == null) return;
    final current = state.currentMerchant!;
    final newStatus = !current.isOpenNow;
    final updated = current.copyWith(isOpenNow: newStatus);
    state = state.copyWith(currentMerchant: updated);

    await _apiService.toggleOpenStatus(newStatus);
  }

  /// Update Profile
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    if (state.currentMerchant == null) return false;

    state = state.copyWith(isLoading: true);
    final updated = await _apiService.updateProfile(data);
    if (updated != null) {
      state = state.copyWith(currentMerchant: updated, isLoading: false);
      return true;
    }
    state = state.copyWith(isLoading: false);
    return false;
  }

  /// Update Services
  Future<bool> updateServices(List<Map<String, dynamic>> services) async {
    if (state.currentMerchant == null) return false;

    state = state.copyWith(isLoading: true);
    final updated = await _apiService.updateServices(services);
    if (updated != null) {
      state = state.copyWith(currentMerchant: updated, isLoading: false);
      return true;
    }
    state = state.copyWith(isLoading: false);
    return false;
  }

  /// Logout
  void logout() async {
    await _apiService.clearAuth();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
