import { Metadata } from "next";
import { MERCHANTS } from "@/data/seed-merchants";
import { MerchantDetailClient } from "./MerchantDetailClient";
import { prisma } from "@/lib/db";
import { parseJsonField } from "@/lib/utils";
import { Merchant } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  
  let merchant: any = null;
  try {
    merchant = await prisma.merchant.findUnique({
      where: { slug: resolvedParams.slug },
    });
  } catch (err) {
    console.error(`[generateMetadata] DB lookup failed for slug: ${resolvedParams.slug}`, err);
  }

  if (!merchant) {
    const seed = MERCHANTS.find((m) => m.slug === resolvedParams.slug);
    if (seed) merchant = seed as any;
  }

  if (!merchant) {
    return {
      title: "Esnaf Profili - Esnafça",
      description: "Doğrulanmış mahalle esnafı ve şeffaf fiyat tarifesi.",
    };
  }

  const title = `${merchant.name} - Şeffaf Fiyat Menüsü & WhatsApp | Esnafça`;
  const description = `${merchant.masterName} (${merchant.city} / ${merchant.district}) şeffaf fiyat menüsü: ${merchant.minPrice} ₺ - ${merchant.maxPrice} ₺. Doğrudan WhatsApp ile komisyonsuz iletişim.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://esnafca.com/esnaf/${merchant.slug}`,
      siteName: "Esnafça",
      images: [
        {
          url: merchant.heroImage,
          width: 800,
          height: 600,
          alt: merchant.name,
        },
      ],
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [merchant.heroImage],
    },
  };
}

export default async function MerchantDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  let merchant: any = null;
  try {
    merchant = await prisma.merchant.findUnique({
      where: { slug: resolvedParams.slug },
      include: { services: true, reviews: true },
    });
  } catch (err) {
    console.error(`[MerchantDetailPage] DB lookup failed for slug: ${resolvedParams.slug}`, err);
  }

  const fallback = MERCHANTS.find((m) => m.slug === resolvedParams.slug) || null;

  const current = merchant || fallback;

  const lat = (current as any)?.coordinates?.lat ?? (current as any)?.latitude ?? null;
  const lng = (current as any)?.coordinates?.lng ?? (current as any)?.longitude ?? null;

  // JSON-LD Schema.org LocalBusiness
  const jsonLd = current
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: current.name,
        image: current.heroImage,
        telephone: current.phone,
        priceRange: `${current.minPrice} TL - ${current.maxPrice} TL`,
        address: {
          "@type": "PostalAddress",
          streetAddress: current.address,
          addressLocality: current.district,
          addressRegion: current.city,
          addressCountry: "TR",
        },
        ...(lat && lng
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: lat,
                longitude: lng,
              },
            }
          : {}),
        aggregateRating:
          current.rating > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: current.rating,
                reviewCount: Math.max(1, current.reviewCount),
              }
            : undefined,
      }
    : null;

  let initialMerchant = fallback;
  if (merchant) {
    try {
      initialMerchant = ({
        ...merchant,
        category: merchant.category as any,
        tier: merchant.tier as any,
        workingHours: parseJsonField(merchant.workingHours, {}),
        galleryImages: parseJsonField(merchant.galleryImages, []),
        specialties: parseJsonField(merchant.specialties, []),
        features: parseJsonField(merchant.features, {}),
        services: merchant.services,
        reviews: merchant.reviews.map((r: any) => ({
          ...r,
          tags: typeof r.tags === "string" ? JSON.parse(r.tags || "[]") : r.tags,
        })),
      } as unknown as Merchant);
    } catch {
      // fallback
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MerchantDetailClient
        slug={resolvedParams.slug}
        initialMerchant={initialMerchant}
      />
    </>
  );
}
