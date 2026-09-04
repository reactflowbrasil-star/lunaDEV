import { NextRequest, NextResponse } from "next/server";
import { generateMedia, GeminiApiError, GeminiConfigError, MediaKind, Quality } from "@/lib/gemini/server";
import { resolveApiKey } from "@/lib/gemini/credential";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey=await resolveApiKey(request);
    if (!["text", "image", "video"].includes(body.kind)) {
      return NextResponse.json({ error: "Tipo de geração inválido." }, { status: 400 });
    }
    if (typeof body.prompt !== "string" || body.prompt.trim().length < 10 || body.prompt.length > 8_000) {
      return NextResponse.json({ error: "Descreva a geração usando entre 10 e 8.000 caracteres." }, { status: 400 });
    }
    const references = Array.isArray(body.references) ? body.references : [];
    if (references.length > 3 || references.some((item: any) =>
      typeof item?.data !== "string" || item.data.length > 14_000_000 ||
      !["image/jpeg", "image/png", "image/webp"].includes(item.mimeType)
    )) return NextResponse.json({ error: "As imagens de referência são inválidas ou excedem o limite." }, { status: 400 });

    const result = await generateMedia({
      kind: body.kind as MediaKind,
      prompt: body.prompt.trim(),
      quality: (["economy", "balanced", "premium"].includes(body.quality) ? body.quality : "balanced") as Quality,
      aspectRatio: body.aspectRatio,
      resolution: body.resolution,
      references,
      apiKey,
    });
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof GeminiApiError ? error.status
      : error instanceof GeminiConfigError ? 503 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha inesperada na geração." }, { status });
  }
}
