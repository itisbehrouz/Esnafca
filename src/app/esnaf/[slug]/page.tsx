import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MERCHANTS } from "@/data/seed-merchants";
import { MerchantDetailClient } from "./MerchantDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const merchant = MERCHANTS.find((m) => m.slug === resolvedParams.slug);

  if (!merchant) {
    return {
      title: "Esnaf Bulunamadı - Esnafça",
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
  const merchant = MERCHANTS.find((m) => m.slug === resolvedParams.slug);

  if (!merchant) {
    notFound();
  }

  // Schema.org JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: merchant.name,
    image: merchant.heroImage,
    telephone: merchant.phone,
    priceRange: `${merchant.minPrice} TRY - ${merchant.maxPrice} TRY`,
    address: {
      "@type": "PostalAddress",
      streetAddress: merchant.address,
      addressLocality: merchant.district,
      addressRegion: merchant.city,
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "41.0082",
      longitude: "28.9784",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: merchant.rating.toString(),
      reviewCount: merchant.reviewCount.toString(),
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Şeffaf Hizmet & Fiyat Menüsü",
      itemListElement: merchant.services.map((s, idx) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.description,
        },
        price: s.minPrice,
        priceCurrency: "TRY",
        position: idx + 1,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MerchantDetailClient merchant={merchant} />
    </>
  );
}
