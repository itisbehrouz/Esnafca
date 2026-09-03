import { Suspense } from "react";
import { HomeInteractive } from "@/components/discovery/HomeInteractive";
import { prisma } from "@/lib/db";
import { Merchant } from "@/types";
import { MERCHANTS as SEED_MERCHANTS } from "@/data/seed-merchants";
import { parseJsonField } from "@/lib/utils";

async function getInitialMerchants(): Promise<Merchant[]> {
  try {
    const dbMerchants = await prisma.merchant.findMany({
      include: {
        services: true,
        reviews: true,
      },
    });
    
    if (dbMerchants.length === 0) {
      return SEED_MERCHANTS;
    }

    return dbMerchants.map(m => ({
      ...m,
      category: m.category as any,
      tier: m.tier as any,
      priceNote: m.priceNote ?? undefined,
      verifiedYear: m.verifiedYear ?? undefined,
      workingHours: parseJsonField(m.workingHours, {}),
      galleryImages: parseJsonField(m.galleryImages, []),
      specialties: parseJsonField(m.specialties, []),
      features: parseJsonField(m.features, {}),
      coordinates: (m.latitude && m.longitude) ? { lat: m.latitude, lng: m.longitude } : undefined,
      services: m.services.map(s => ({
        ...s,
        description: s.description ?? undefined,
        maxPrice: s.maxPrice ?? undefined,
        estimatedDuration: s.estimatedDuration ?? undefined,
      })),
      reviews: m.reviews.map(r => ({
        ...r,
        profession: r.profession ?? undefined,
        tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags
      }))
    } as unknown as Merchant));
  } catch (e) {
    console.error("DB connection error, falling back to seed", e);
    return SEED_MERCHANTS;
  }
}

export default async function HomePage() {
  const merchants = await getInitialMerchants();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Esnafça",
            "url": "https://esnafca.com",
            "description": "Türkiye'nin küçük esnaf ve yerel zanaatkârlarını buluşturan komisyonsuz platform.",
          })
        }}
      />
      <Suspense fallback={<div className="min-h-[100dvh] bg-[#F2F2F7] dark:bg-black" />}>
        <HomeInteractive initialMerchants={merchants} />
      </Suspense>
    </>
  );
}
