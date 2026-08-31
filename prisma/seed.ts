import { PrismaClient } from '@prisma/client';
import { MERCHANTS } from '../src/data/seed-merchants';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  // Clear existing
  await prisma.review.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.merchant.deleteMany();

  for (const m of MERCHANTS) {
    const merchant = await prisma.merchant.create({
      data: {
        id: m.id,
        slug: m.slug,
        name: m.name,
        craftTitle: m.craftTitle,
        masterName: m.masterName,
        category: m.category,
        city: m.city,
        district: m.district,
        neighborhood: m.neighborhood,
        address: m.address,
        latitude: m.coordinates?.lat,
        longitude: m.coordinates?.lng,
        phone: m.phone,
        whatsapp: m.whatsapp,
        rating: m.rating,
        reviewCount: m.reviewCount,
        verified: m.verified,
        verifiedYear: m.verifiedYear,
        tier: m.tier,
        experienceYears: m.experienceYears,
        minPrice: m.minPrice,
        maxPrice: m.maxPrice,
        priceNote: m.priceNote,
        workingHours: JSON.stringify(m.workingHours),
        heroImage: m.heroImage,
        galleryImages: JSON.stringify(m.galleryImages),
        bio: m.bio,
        specialties: JSON.stringify(m.specialties),
        features: JSON.stringify(m.features),
        isOpenNow: m.isOpenNow,
        services: {
          create: m.services.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            minPrice: s.minPrice,
            maxPrice: s.maxPrice,
            isStartingPrice: s.isStartingPrice,
            estimatedDuration: s.estimatedDuration,
            popular: s.popular,
          }))
        },
        reviews: {
          create: m.reviews.map(r => ({
            id: r.id,
            author: r.author,
            profession: r.profession,
            rating: r.rating,
            date: r.date,
            comment: r.comment,
            tags: JSON.stringify(r.tags || []),
            verifiedCustomer: r.verifiedCustomer,
          }))
        }
      }
    });
    console.log(`Created merchant with id: ${merchant.id}`);
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
