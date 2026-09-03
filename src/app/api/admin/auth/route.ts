import { NextResponse } from "next/server";
import { checkAdminPassword, signAdminToken, getAdminSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const isAdmin = await getAdminSessionFromRequest(request);
  return NextResponse.json({
    success: true,
    authenticated: isAdmin,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Yönetici şifresi gereklidir." },
        { status: 400 }
      );
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Hatalı yönetici şifresi." },
        { status: 401 }
      );
    }

    const token = await signAdminToken();

    const response = NextResponse.json({
      success: true,
      token,
      message: "Yönetici girişi başarılı.",
    });

    response.cookies.set({
      name: "esnaf_admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return NextResponse.json(
      { success: false, error: "Yönetici girişi yapılamadı." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Yönetici oturumu kapatıldı.",
  });

  response.cookies.set({
    name: "esnaf_admin_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
