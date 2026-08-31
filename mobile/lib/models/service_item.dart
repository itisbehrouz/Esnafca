class ServiceItem {
  final String id;
  final String name;
  final String? description;
  final double minPrice;
  final double? maxPrice;
  final bool isStartingPrice;
  final String? estimatedDuration;
  final bool popular;

  ServiceItem({
    required this.id,
    required this.name,
    this.description,
    required this.minPrice,
    this.maxPrice,
    this.isStartingPrice = false,
    this.estimatedDuration,
    this.popular = false,
  });

  factory ServiceItem.fromJson(Map<String, dynamic> json) {
    return ServiceItem(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      minPrice: (json['minPrice'] as num?)?.toDouble() ?? 0.0,
      maxPrice: (json['maxPrice'] as num?)?.toDouble(),
      isStartingPrice: json['isStartingPrice'] ?? false,
      estimatedDuration: json['estimatedDuration'],
      popular: json['popular'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'minPrice': minPrice,
      'maxPrice': maxPrice,
      'isStartingPrice': isStartingPrice,
      'estimatedDuration': estimatedDuration,
      'popular': popular,
    };
  }

  ServiceItem copyWith({
    String? id,
    String? name,
    String? description,
    double? minPrice,
    double? maxPrice,
    bool? isStartingPrice,
    String? estimatedDuration,
    bool? popular,
  }) {
    return ServiceItem(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      isStartingPrice: isStartingPrice ?? this.isStartingPrice,
      estimatedDuration: estimatedDuration ?? this.estimatedDuration,
      popular: popular ?? this.popular,
    );
  }
}
