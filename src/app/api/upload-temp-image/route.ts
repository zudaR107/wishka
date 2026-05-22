import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { saveImageToUploadDir, MAX_UPLOAD_BYTES } from "@/modules/wishlist/server/item-image";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * POST /api/upload-temp-image
 *
 * Accepts multipart/form-data with field "image".
 * Saves the file to UPLOAD_DIR without associating it with any item.
 * The caller is responsible for passing the returned imageUrl through
 * form submission so it can be written to the DB on item creation.
 *
 * Returns { imageUrl: string } on success.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no-file" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "invalid-type" }, { status: 415 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await saveImageToUploadDir(buffer, file.type);

  if (result.status === "error") {
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }

  return NextResponse.json({ imageUrl: result.imageUrl });
}
