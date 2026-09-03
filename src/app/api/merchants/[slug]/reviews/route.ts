import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { author, profession, rating, comment, tags } = body;

    if (!author || !comment || !rating) {
      return NextResponse.json(
        { success: false, error: "İsim, puan ve yorum metni zorunludur." },
        { status: 400 }
      );
    }

    const numRating = Math.min(5, Math.max(1, Math.round(Number(rating))));

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      include: { reviews: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "Esnaf bulunamadı." },
        { status: 404 }
      );
    }

    // Format date string (e.g., "Eylül 2026")
    const now = new Date();
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    const dateStr = `${months[now.getMonth()]} ${now.getFullYear()}`;

    // Create review
    const newReview = await prisma.review.create({
      data: {
        merchantId: merchant.id,
        author: author.trim(),
        profession: profession?.trim() || "Mahalle Sakini",
        rating: numRating,
        date: dateStr,
        comment: comment.trim(),
        tags: JSON.stringify(Array.isArray(tags) ? tags : ["Doğrulanmış Deneyim"]),
        verifiedCustomer: true,
      },
    });

    // Calculate new average rating & count
    const allReviews = [...merchant.reviews, newReview];
    const newCount = allReviews.length;
    const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = Number((totalScore / newCount).toFixed(1));

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        rating: newAverage,
        reviewCount: newCount,
      },
    });

    revalidatePath(`/esnaf/${slug}`);
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: {
        id: newReview.id,
        author: newReview.author,
        profession: newReview.profession,
        rating: newReview.rating,
        date: newReview.date,
        comment: newReview.comment,
        tags: JSON.parse(newReview.tags),
      },
      newMerchantRating: newAverage,
      newReviewCount: newCount,
    });
  } catch (error) {
    console.error("Create Review API Error:", error);
    return NextResponse.json(
      { success: false, error: "Yorum kaydedilemedi." },
      { status: 500 }
    );
  }
}
