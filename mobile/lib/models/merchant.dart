import 'service_item.dart';
import 'review.dart';

class Merchant {
  final String id;
  final String slug;
  final String name;
  final String craftTitle;
  final String masterName;
  final String category;
  final String city;
  final String district;
  final String neighborhood;
  final String address;
  final double? latitude;
  final double? longitude;
  final String phone;
  final String whatsapp;
  final double rating;
  final int reviewCount;
  final bool verified;
  final int? verifiedYear;
  final String tier; // "free", "pro", "plus"
  final int experienceYears;
  final double minPrice;
  final double maxPrice;
  final String? priceNote;
  final Map<String, dynamic> workingHours;
  final String heroImage;
  final List<String> galleryImages;
  final String bio;
  final List<String> specialties;
  final Map<String, dynamic> features;
  final bool isOpenNow;
  final List<ServiceItem> services;
  final List<Review> reviews;

  Merchant({
    required this.id,
    required this.slug,
    required this.name,
    required this.craftTitle,
    required this.masterName,
    required this.category,
    required this.city,
    required this.district,
    required this.neighborhood,
    required this.address,
    this.latitude,
    this.longitude,
    required this.phone,
    required this.whatsapp,
    required this.rating,
    required this.reviewCount,
    required this.verified,
    this.verifiedYear,
    required this.tier,
    required this.experienceYears,
    required this.minPrice,
    required this.maxPrice,
    this.priceNote,
    required this.workingHours,
    required this.heroImage,
    required this.galleryImages,
    required this.bio,
    required this.specialties,
    required this.features,
    required this.isOpenNow,
    required this.services,
    required this.reviews,
  });

  factory Merchant.fromJson(Map<String, dynamic> json) {
    return Merchant(
      id: json['id'] ?? '',
      slug: json['slug'] ?? '',
      name: json['name'] ?? '',
      craftTitle: json['craftTitle'] ?? '',
      masterName: json['masterName'] ?? '',
      category: json['category'] ?? '',
      city: json['city'] ?? '',
      district: json['district'] ?? '',
      neighborhood: json['neighborhood'] ?? '',
      address: json['address'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      phone: json['phone'] ?? '',
      whatsapp: json['whatsapp'] ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      reviewCount: json['reviewCount'] ?? 0,
      verified: json['verified'] ?? false,
      verifiedYear: json['verifiedYear'],
      tier: json['tier'] ?? 'free',
      experienceYears: json['experienceYears'] ?? 0,
      minPrice: (json['minPrice'] as num?)?.toDouble() ?? 0.0,
      maxPrice: (json['maxPrice'] as num?)?.toDouble() ?? 0.0,
      priceNote: json['priceNote'],
      workingHours: json['workingHours'] is Map ? Map<String, dynamic>.from(json['workingHours']) : {},
      heroImage: json['heroImage'] ?? '',
      galleryImages: json['galleryImages'] != null ? List<String>.from(json['galleryImages']) : [],
      bio: json['bio'] ?? '',
      specialties: json['specialties'] != null ? List<String>.from(json['specialties']) : [],
      features: json['features'] is Map ? Map<String, dynamic>.from(json['features']) : {},
      isOpenNow: json['isOpenNow'] ?? false,
      services: (json['services'] as List<dynamic>?)
              ?.map((s) => ServiceItem.fromJson(s))
              .toList() ??
          [],
      reviews: (json['reviews'] as List<dynamic>?)
              ?.map((r) => Review.fromJson(r))
              .toList() ??
          [],
    );
  }

  Merchant copyWith({
    String? id,
    String? slug,
    String? name,
    String? craftTitle,
    String? masterName,
    String? category,
    String? city,
    String? district,
    String? neighborhood,
    String? address,
    double? latitude,
    double? longitude,
    String? phone,
    String? whatsapp,
    double? rating,
    int? reviewCount,
    bool? verified,
    int? verifiedYear,
    String? tier,
    int? experienceYears,
    double? minPrice,
    double? maxPrice,
    String? priceNote,
    Map<String, dynamic>? workingHours,
    String? heroImage,
    List<String>? galleryImages,
    String? bio,
    List<String>? specialties,
    Map<String, dynamic>? features,
    bool? isOpenNow,
    List<ServiceItem>? services,
    List<Review>? reviews,
  }) {
    return Merchant(
      id: id ?? this.id,
      slug: slug ?? this.slug,
      name: name ?? this.name,
      craftTitle: craftTitle ?? this.craftTitle,
      masterName: masterName ?? this.masterName,
      category: category ?? this.category,
      city: city ?? this.city,
      district: district ?? this.district,
      neighborhood: neighborhood ?? this.neighborhood,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      phone: phone ?? this.phone,
      whatsapp: whatsapp ?? this.whatsapp,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      verified: verified ?? this.verified,
      verifiedYear: verifiedYear ?? this.verifiedYear,
      tier: tier ?? this.tier,
      experienceYears: experienceYears ?? this.experienceYears,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      priceNote: priceNote ?? this.priceNote,
      workingHours: workingHours ?? this.workingHours,
      heroImage: heroImage ?? this.heroImage,
      galleryImages: galleryImages ?? this.galleryImages,
      bio: bio ?? this.bio,
      specialties: specialties ?? this.specialties,
      features: features ?? this.features,
      isOpenNow: isOpenNow ?? this.isOpenNow,
      services: services ?? this.services,
      reviews: reviews ?? this.reviews,
    );
  }
}
