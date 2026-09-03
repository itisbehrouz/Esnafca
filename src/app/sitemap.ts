import { MetadataRoute } from "next";
import { CATEGORIES } from "@/data/categories";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://esnafca.com";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kategoriler`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mahalle`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fiyatlandirma`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/esnaf-ekle`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/gizlilik-ve-kosullar`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic Merchant Routes from real database records
  let merchants: { slug: string; updatedAt: Date }[] = [];
  try {
    merchants = await prisma.merchant.findMany({
      select: { slug: true, updatedAt: true },
    });
  } catch (err) {
    console.error("Error loading merchants for sitemap:", err);
  }

  const merchantRoutes: MetadataRoute.Sitemap = merchants.map((m) => ({
    url: `${baseUrl}/esnaf/${m.slug}`,
    lastModified: m.updatedAt || new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Dynamic Category Routes
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${baseUrl}/?category=${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...merchantRoutes, ...categoryRoutes];
}
