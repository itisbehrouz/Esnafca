import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/merchant.dart';
import '../services/api_service.dart';

class AuthState {
  final Merchant? currentMerchant;
  final bool isLoading;
  final String? status; // "approved", "pending", "rejected", null
  final String? errorMessage;

  AuthState({
    this.currentMerchant,
    this.isLoading = false,
    this.status,
    this.errorMessage,
  });

  AuthState copyWith({
    Merchant? currentMerchant,
    bool? isLoading,
    String? status,
    String? errorMessage,
  }) {
    return AuthState(
      currentMerchant: currentMerchant ?? this.currentMerchant,
      isLoading: isLoading ?? this.isLoading,
      status: status ?? this.status,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthNotifier() : super(AuthState());

  Future<bool> login(String phone, String otp) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final res = await _apiService.loginByPhone(phone, otp);
      if (res != null && res['success'] == true) {
        if (res['status'] == 'approved' && res['merchant'] != null) {
          final merchant = Merchant.fromJson(res['merchant']);
          await _storage.write(key: 'merchant_id', value: merchant.id);
          state = state.copyWith(
            currentMerchant: merchant,
            status: 'approved',
            isLoading: false,
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
          errorMessage: res?['error'] ?? "Giriş başarısız oldu.",
          isLoading: false,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        errorMessage: "Sunucu bağlantı hatası.",
        isLoading: false,
      );
      return false;
    }
  }

  Future<bool> loginWithId(String id) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final merchant = await _apiService.loginById(id);
      if (merchant != null) {
        await _storage.write(key: 'merchant_id', value: merchant.id);
        state = state.copyWith(
          currentMerchant: merchant,
          status: 'approved',
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          errorMessage: "Demo hesaba giriş yapılamadı.",
          isLoading: false,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        errorMessage: "Sunucu hatası oluştu.",
        isLoading: false,
      );
      return false;
    }
  }

  Future<void> toggleOpenStatus() async {
    if (state.currentMerchant == null) return;
    final current = state.currentMerchant!;
    final newStatus = !current.isOpenNow;
    final updated = current.copyWith(isOpenNow: newStatus);
    state = state.copyWith(currentMerchant: updated);

    await _apiService.toggleOpenStatus(current.id, newStatus);
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    if (state.currentMerchant == null) return false;
    final current = state.currentMerchant!;
    data['id'] = current.id;

    state = state.copyWith(isLoading: true);
    final updated = await _apiService.updateProfile(data);
    if (updated != null) {
      state = state.copyWith(currentMerchant: updated, isLoading: false);
      return true;
    }
    state = state.copyWith(isLoading: false);
    return false;
  }

  Future<bool> updateServices(List<Map<String, dynamic>> services) async {
    if (state.currentMerchant == null) return false;
    final current = state.currentMerchant!;

    state = state.copyWith(isLoading: true);
    final updated = await _apiService.updateServices(current.id, services);
    if (updated != null) {
      state = state.copyWith(currentMerchant: updated, isLoading: false);
      return true;
    }
    state = state.copyWith(isLoading: false);
    return false;
  }

  void logout() async {
    await _storage.delete(key: 'merchant_id');
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
