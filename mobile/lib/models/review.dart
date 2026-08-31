class Review {
  final String id;
  final String author;
  final String? profession;
  final int rating;
  final String date;
  final String comment;
  final List<String> tags;
  final bool verifiedCustomer;

  Review({
    required this.id,
    required this.author,
    this.profession,
    required this.rating,
    required this.date,
    required this.comment,
    required this.tags,
    this.verifiedCustomer = false,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id']?.toString() ?? '',
      author: json['author'] ?? '',
      profession: json['profession'],
      rating: json['rating'] ?? 5,
      date: json['date'] ?? '',
      comment: json['comment'] ?? '',
      tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
      verifiedCustomer: json['verifiedCustomer'] ?? false,
    );
  }
}
