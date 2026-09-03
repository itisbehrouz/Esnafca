import { prisma } from "@/lib/db";
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

  return <NeighborhoodClient initialMerchants={merchants} />;
}
