import 'service_item.dart';

class Appointment {
  final String id;
  final String merchantId;
  final String? serviceId;
  final String customerName;
  final String customerPhone;
  final String? customerNote;
  final String date;
  final String startTime;
  final String? endTime;
  final double price;
  final String status; // "pending", "confirmed", "completed", "cancelled"
  final DateTime? createdAt;
  final ServiceItem? service;

  Appointment({
    required this.id,
    required this.merchantId,
    this.serviceId,
    required this.customerName,
    required this.customerPhone,
    this.customerNote,
    required this.date,
    required this.startTime,
    this.endTime,
    required this.price,
    this.status = "pending",
    this.createdAt,
    this.service,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id']?.toString() ?? '',
      merchantId: json['merchantId']?.toString() ?? '',
      serviceId: json['serviceId']?.toString(),
      customerName: json['customerName']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString() ?? '',
      customerNote: json['customerNote']?.toString(),
      date: json['date']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      service: json['service'] != null
          ? ServiceItem.fromJson(json['service'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'merchantId': merchantId,
      'serviceId': serviceId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerNote': customerNote,
      'date': date,
      'startTime': startTime,
      'endTime': endTime,
      'price': price,
      'status': status,
      'createdAt': createdAt?.toIso8601String(),
      'service': service?.toJson(),
    };
  }

  Appointment copyWith({
    String? id,
    String? merchantId,
    String? serviceId,
    String? customerName,
    String? customerPhone,
    String? customerNote,
    String? date,
    String? startTime,
    String? endTime,
    double? price,
    String? status,
    DateTime? createdAt,
    ServiceItem? service,
  }) {
    return Appointment(
      id: id ?? this.id,
      merchantId: merchantId ?? this.merchantId,
      serviceId: serviceId ?? this.serviceId,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerNote: customerNote ?? this.customerNote,
      date: date ?? this.date,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      price: price ?? this.price,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      service: service ?? this.service,
    );
  }

  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
}
