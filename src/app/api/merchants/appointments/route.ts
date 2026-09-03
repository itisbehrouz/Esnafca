import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMerchantSessionFromRequest, getAdminSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const merchantSession = await getMerchantSessionFromRequest(request);
    const isAdmin = await getAdminSessionFromRequest(request);

    if (!merchantSession && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Lütfen giriş yapınız." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const merchantId = merchantSession?.id;
    if (!merchantId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Esnaf oturumu bulunamadı." },
        { status: 401 }
      );
    }

    const whereClause: { merchantId?: string; date?: string } = {};
    if (merchantId) {
      whereClause.merchantId = merchantId;
    }
    if (date) {
      whereClause.date = date;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("API Appointments GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Randevular getirilemedi." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const merchantSession = await getMerchantSessionFromRequest(request);
    const isAdmin = await getAdminSessionFromRequest(request);

    if (!merchantSession && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Lütfen giriş yapınız." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { success: false, error: "Randevu ID ve yeni durum gereklidir." },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz randevu durumu." },
        { status: 400 }
      );
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Randevu bulunamadı." },
        { status: 404 }
      );
    }

    // Must belong to merchant or caller must be admin
    if (!isAdmin && existing.merchantId !== merchantSession?.id) {
      return NextResponse.json(
        { success: false, error: "Bu randevuyu güncelleme yetkiniz yok." },
        { status: 403 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: { service: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("API Appointments PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: "Randevu güncellenemedi." },
      { status: 500 }
    );
  }
}
