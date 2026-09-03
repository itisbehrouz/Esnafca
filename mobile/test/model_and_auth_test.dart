import 'package:flutter_test/flutter_test.dart';
import 'package:esnafca/models/appointment.dart';
import 'package:esnafca/core/constants/api_constants.dart';
import 'package:esnafca/providers/auth_provider.dart';

void main() {
  group('Appointment Model Tests', () {
    test('Appointment fromJson and toJson serialization', () {
      final json = {
        'id': 'apt-101',
        'merchantId': 'merchant-1',
        'serviceId': 'srv-1',
        'customerName': 'Ahmet Yılmaz',
        'customerPhone': '05321112233',
        'customerNote': 'Acil bakım gerekiyor',
        'date': '2026-10-15',
        'startTime': '14:30',
        'endTime': '15:00',
        'price': 350.0,
        'status': 'pending',
        'service': {
          'id': 'srv-1',
          'name': 'Periyodik Yağ Değişimi',
          'minPrice': 350.0,
          'maxPrice': 500.0,
        },
      };

      final apt = Appointment.fromJson(json);

      expect(apt.id, 'apt-101');
      expect(apt.customerName, 'Ahmet Yılmaz');
      expect(apt.price, 350.0);
      expect(apt.isPending, isTrue);
      expect(apt.isConfirmed, isFalse);
      expect(apt.service?.name, 'Periyodik Yağ Değişimi');

      final serialized = apt.toJson();
      expect(serialized['id'], 'apt-101');
      expect(serialized['status'], 'pending');
      expect(serialized['price'], 350.0);
    });

    test('Appointment status helpers', () {
      final aptConfirmed = Appointment(
        id: '1',
        merchantId: 'm1',
        customerName: 'Test',
        customerPhone: '0500',
        date: '2026-10-10',
        startTime: '10:00',
        price: 200,
        status: 'confirmed',
      );
      expect(aptConfirmed.isConfirmed, isTrue);
      expect(aptConfirmed.isPending, isFalse);

      final aptCompleted = aptConfirmed.copyWith(status: 'completed');
      expect(aptCompleted.isCompleted, isTrue);
    });
  });

  group('ApiConstants Resolution Tests', () {
    test('baseUrl and endpoints are valid URI strings', () {
      final base = ApiConstants.baseUrl;
      expect(base, isNotEmpty);
      expect(base.startsWith('http'), isTrue);

      expect(ApiConstants.merchants, startsWith(base));
      expect(ApiConstants.appointments, startsWith(base));
      expect(ApiConstants.upload, startsWith(base));
    });
  });

  group('AuthState Tests', () {
    test('AuthState defaults and copyWith', () {
      final state = AuthState();
      expect(state.currentMerchant, isNull);
      expect(state.isAuthenticated, isFalse);
      expect(state.isLoading, isFalse);

      final authedState = state.copyWith(isAuthenticated: true);
      expect(authedState.isAuthenticated, isTrue);
    });
  });
}
