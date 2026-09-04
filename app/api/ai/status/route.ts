import { NextResponse } from "next/server";
import { chooseModel, GeminiApiError, GeminiConfigError } from "@/lib/gemini/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [text, image, video] = await Promise.all([
      chooseModel("text"), chooseModel("image"), chooseModel("video"),
    ]);
    return NextResponse.json({
      configured: true,
      models: { text, image, video },
      message: "Gemini conectado e modelos selecionados automaticamente.",
    });
  } catch (error) {
    const status = error instanceof GeminiApiError ? error.status : 503;
    return NextResponse.json({
      configured: false,
      models: null,
      message: error instanceof GeminiConfigError || error instanceof GeminiApiError
        ? error.message : "Não foi possível validar a configuração Gemini.",
    }, { status });
  }
}
