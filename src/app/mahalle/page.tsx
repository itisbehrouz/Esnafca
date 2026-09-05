import { prisma } from "@/lib/db";
import { MERCHANTS } from "@/data/seed-merchants";
import { NeighborhoodClient } from "./NeighborhoodClient";

export const dynamic = "force-dynamic";

export default async function NeighborhoodPage() {
  let merchants: {
    id: string;
    city: string;
    district: string;
    neighborhood: string;
  }[] = [];

  try {
    merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        city: true,
        district: true,
        neighborhood: true,
      },
    });
  } catch (error) {
    console.error("Error loading merchants for neighborhood directory:", error);
  }

  if (merchants.length === 0) {
    merchants = MERCHANTS.map((m) => ({
      id: m.id,
      city: m.city,
      district: m.district,
      neighborhood: m.neighborhood,
    }));
  }

  return <NeighborhoodClient initialMerchants={merchants} />;
}
