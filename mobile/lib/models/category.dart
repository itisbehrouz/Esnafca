class CategoryModel {
  final String id;
  final String name;
  final String shortName;
  final String icon;
  final String description;
  final int count;

  const CategoryModel({
    required this.id,
    required this.name,
    required this.shortName,
    required this.icon,
    required this.description,
    required this.count,
  });
}

const List<CategoryModel> kCategories = [
  CategoryModel(id: 'berber', name: 'Erkek Berberi & Kuaför', shortName: 'Berber', icon: 'scissors', description: 'Klasik tıraş, saç kesim ve sakal', count: 48),
  CategoryModel(id: 'kuafor', name: 'Kadın Kuaförü & Saç Tasarım', shortName: 'Kadın Kuaför', icon: 'sparkles', description: 'Boya, fön, kesim ve gelin başı', count: 36),
  CategoryModel(id: 'oto-tamir', name: 'Oto Tamir & Mekanik', shortName: 'Oto Tamir', icon: 'car', description: 'Periyodik bakım, fren ve motor servisi', count: 52),
  CategoryModel(id: 'cilingir', name: 'Çilingir & Anahtarcı', shortName: 'Çilingir', icon: 'key', description: '7/24 kapı açma, kilit ve immobilizer', count: 28),
  CategoryModel(id: 'terzi', name: 'Terzi & Kuru Temizleme', shortName: 'Terzi', icon: 'scissors', description: 'Paça boyu, daraltma ve tadilat', count: 41),
  CategoryModel(id: 'veteriner', name: 'Veteriner & Pet Kuaför', shortName: 'Veteriner', icon: 'dog', description: 'Aşı, muayene ve pet bakımı', count: 19),
  CategoryModel(id: 'elektrikci', name: 'Elektrik & Tesisat', shortName: 'Elektrikçi', icon: 'hammer', description: 'Arıza onarım, montaj ve taahhüt', count: 33),
  CategoryModel(id: 'lostra', name: 'Lostra & Ayakkabı Tamiri', shortName: 'Lostra', icon: 'footprints', description: 'Taban değişimi, boya ve bakım', count: 22),
];
