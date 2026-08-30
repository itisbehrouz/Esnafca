import { NextResponse } from "next/server";
import { MERCHANTS } from "@/data/seed-merchants";

export async function GET() {
  return NextResponse.json({
    success: true,
    count: MERCHANTS.length,
    data: MERCHANTS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.phone || !body.city || !body.district) {
      return NextResponse.json(
        {
          success: false,
          error: "Eksik bilgi: Dükkan adı, telefon, şehir ve ilçe zorunludur.",
        },
        { status: 400 }
      );
    }

    const newApplication = {
      id: `app-${Date.now()}`,
      name: body.name,
      masterName: body.masterName || "Usta",
      category: body.category || "terzi-lostra",
      city: body.city,
      district: body.district,
      neighborhood: body.neighborhood || "",
      address: body.address || "",
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      plan: body.plan || "pro",
      services: body.services || [],
      submittedAt: new Date().toISOString(),
      status: "pending_review",
    };

    console.log("[Esnafça API] Yeni Esnaf Başvurusu Alındı:", newApplication);

    return NextResponse.json({
      success: true,
      message: "Dükkan başvurunuz başarıyla alındı. Esnafça onay ekibi 2 saat içinde iletişime geçecektir.",
      application: newApplication,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Başvuru işlenirken sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}
