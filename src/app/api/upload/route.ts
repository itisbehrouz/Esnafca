import { NextResponse } from "next/server";
import { getMerchantSessionFromRequest, getAdminSessionFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    // 1. Verify Authentication
    const merchantSession = await getMerchantSessionFromRequest(request);
    const isAdmin = await getAdminSessionFromRequest(request);

    if (!merchantSession && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim. Görsel yüklemek için giriş yapınız." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Yüklenecek dosya bulunamadı." },
        { status: 400 }
      );
    }

    // 2. Validate MIME type & size
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Yalnızca JPG, PNG, WEBP ve AVIF formatında görseller yüklenebilir." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu 10MB sınırını aşamaz." },
        { status: 400 }
      );
    }

    // 3. Save file locally (or through Cloud storage adapter)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const uniqueName = `esnaf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
    const filePath = join(uploadsDir, uniqueName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("File Upload API Error:", error);
    return NextResponse.json(
      { success: false, error: "Görsel yükleme işlemi başarısız oldu." },
      { status: 500 }
    );
  }
}
