import { Metadata } from "next";
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
  const initialMerchant = MERCHANTS.find((m) => m.slug === resolvedParams.slug) || null;

  return (
    <MerchantDetailClient
      slug={resolvedParams.slug}
      initialMerchant={initialMerchant}
    />
  );
}
