import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      masterName,
      category,
      experienceYears,
      city,
      district,
      neighborhood,
      address,
      latitude,
      longitude,
      phone,
      whatsapp,
      plan,
      services,
    } = body;

    if (!name || !masterName || !category || !city || !district || !phone) {
      return NextResponse.json(
        { success: false, error: "Lütfen zorunlu alanları doldurunuz." },
        { status: 400 }
      );
    }

    const application = await prisma.merchantApplication.create({
      data: {
        name,
        masterName,
        category,
        experienceYears: Number(experienceYears) || 5,
        city,
        district,
        neighborhood: neighborhood || "",
        address: address || `${neighborhood || ""}, ${district} / ${city}`,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        phone,
        whatsapp: whatsapp || phone,
        plan: plan || "pro",
        services: JSON.stringify(services || []),
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: "Başvurunuz başarıyla alındı ve onaya gönderildi.",
    });
  } catch (error) {
    console.error("API Submit Application Error:", error);
    return NextResponse.json(
      { success: false, error: "Başvuru kaydedilemedi." },
      { status: 500 }
    );
  }
}
