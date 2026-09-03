import { NextResponse } from "next/server";
import { getMerchantSessionFromRequest, getAdminSessionFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomBytes } from "crypto";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const DANGEROUS_EXTENSIONS_PATTERN =
  /\.(html?|svg|js|mjs|cjs|php|phtml|sh|bash|exe|cmd|bat|dll|py|rb|pl|cgi|vbs|jar)(\.|$)/i;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate image buffer header magic bytes against expected file extension.
 * Rejects disguised executable, SVG, or HTML scripts.
 */
function validateImageMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 12) return false;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  const isAvif =
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis", "mif1"].includes(buffer.toString("ascii", 8, 12));

  if (ext === "jpg" || ext === "jpeg") return isJpeg;
  if (ext === "png") return isPng;
  if (ext === "webp") return isWebp;
  if (ext === "avif") return isAvif;

  return false;
}

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

    // 2. Reject path traversal sequences and dangerous/executable extensions in original filename
    const originalName = file.name || "";
    if (
      originalName.includes("..") ||
      originalName.includes("/") ||
      originalName.includes("\\") ||
      originalName.includes("%00") ||
      DANGEROUS_EXTENSIONS_PATTERN.test(originalName)
    ) {
      return NextResponse.json(
        { success: false, error: "Geçersiz veya güvenli olmayan dosya adı." },
        { status: 400 }
      );
    }

    // 3. Strict extension whitelist
    const extParts = originalName.split(".");
    const rawExt = extParts.length > 1 ? extParts.pop()!.toLowerCase().trim() : "";
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { success: false, error: "Yalnızca JPG, JPEG, PNG, WEBP ve AVIF formatında görseller yüklenebilir." },
        { status: 400 }
      );
    }

    // 4. Validate MIME type & file size
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Desteklenmeyen görsel içerik tipi." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu 10MB sınırını aşamaz." },
        { status: 400 }
      );
    }

    // 5. Read bytes and validate magic bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateImageMagicBytes(buffer, rawExt)) {
      return NextResponse.json(
        { success: false, error: "Dosya içeriği geçerli bir görsel formatı ile eşleşmiyor." },
        { status: 400 }
      );
    }

    // 6. Generate random cryptographic filename
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const randomHex = randomBytes(16).toString("hex");
    const safeExt = rawExt === "jpeg" ? "jpg" : rawExt;
    const uniqueName = `esnaf_${randomHex}.${safeExt}`;
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
