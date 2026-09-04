import "server-only";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export type MediaKind = "text" | "image" | "video";
export type Quality = "economy" | "balanced" | "premium";

type GeminiModel = {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
};

const FALLBACKS: Record<MediaKind, Record<Quality, string[]>> = {
  text: {
    economy: ["gemini-3.1-flash-lite", "gemini-flash-latest"],
    balanced: ["gemini-3.5-flash", "gemini-flash-latest"],
    premium: ["gemini-3.5-pro", "gemini-3.5-flash"],
  },
  image: {
    economy: ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"],
    balanced: ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"],
    premium: ["gemini-3-pro-image", "gemini-3.1-flash-image"],
  },
  video: {
    economy: ["gemini-omni-1.1-flash", "veo-3.1-lite-generate-preview"],
    balanced: ["gemini-omni-1.1-flash", "veo-3.1-fast-generate-preview"],
    premium: ["gemini-omni-1.1-flash", "veo-3.1-generate-preview"],
  },
};

const OVERRIDES: Record<MediaKind, string> = {
  text: "AI_TEXT_MODEL",
  image: "AI_IMAGE_MODEL",
  video: "AI_VIDEO_MODEL",
};

export function getApiKey(provided?:string|null) {
  const key = provided ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new GeminiConfigError("A variável GEMINI_API_KEY não está configurada.");
  return key;
}

export class GeminiConfigError extends Error {}
export class GeminiApiError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

export async function listModels(apiKey?:string|null): Promise<GeminiModel[]> {
  const key = getApiKey(apiKey);
  const response = await fetch(`${API_BASE}/models`, {
    headers: { "x-goog-api-key": key },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json();
  if (!response.ok) throw new GeminiApiError(publicError(data), response.status);
  return data.models ?? [];
}

export async function chooseModel(kind: MediaKind, quality: Quality = "balanced", apiKey?:string|null) {
  const override = process.env[OVERRIDES[kind]]?.replace(/^models\//, "");
  const available = await listModels(apiKey);
  const names = new Set(available.map(model => model.name.replace(/^models\//, "")));
  if (override) {
    if (!names.has(override)) throw new GeminiConfigError(
      `${OVERRIDES[kind]} aponta para um modelo indisponível nesta conta: ${override}`
    );
    return override;
  }
  const selected = FALLBACKS[kind][quality].find(name => names.has(name));
  if (selected) return selected;
  const inferred = available.find(model => {
    const name = model.name.toLowerCase();
    return kind === "image" ? name.includes("image") : kind === "video" ? (name.includes("omni") || name.includes("veo")) : !name.includes("image");
  });
  if (!inferred) throw new GeminiConfigError(`Nenhum modelo compatível com ${kind} está disponível nesta conta.`);
  return inferred.name.replace(/^models\//, "");
}

export async function generateMedia(input: {
  kind: MediaKind;
  prompt: string;
  quality?: Quality;
  aspectRatio?: string;
  resolution?: string;
  references?: Array<{ data: string; mimeType: string }>;
  apiKey?: string | null;
}) {
  const key = getApiKey(input.apiKey);
  const model = await chooseModel(input.kind, input.quality, key);
  const references = (input.references ?? []).slice(0, 3).map(item => ({
    type: "image",
    data: stripDataUrl(item.data),
    mime_type: item.mimeType,
  }));
  const payload = {
    model,
    input: references.length ? [...references, { type: "text", text: input.prompt }] : input.prompt,
    response_format: {
      type: input.kind,
      ...(input.aspectRatio ? { aspect_ratio: normalizeRatio(input.aspectRatio, input.kind) } : {}),
      ...(input.resolution ? { resolution: input.resolution } : {}),
    },
  };
  const response = await fetch(`${API_BASE}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(input.kind === "video" ? 290_000 : 120_000),
  });
  const data = await response.json();
  if (!response.ok) throw new GeminiApiError(publicError(data), response.status);
  const media = extractMedia(data, input.kind);
  return { model, interactionId: data.id, status: data.status ?? "completed", media };
}

function extractMedia(data: any, kind: MediaKind) {
  const expected = kind === "image" ? "image" : kind === "video" ? "video" : "text";
  for (const step of data.steps ?? []) {
    for (const content of step.content ?? []) {
      if (content.type === expected) {
        return {
          type: expected,
          mimeType: content.mime_type ?? (kind === "video" ? "video/mp4" : "image/png"),
          data: content.data,
          text: content.text,
        };
      }
    }
  }
  throw new GeminiApiError("O Gemini concluiu a solicitação, mas não retornou a mídia esperada.");
}

function stripDataUrl(value: string) { return value.replace(/^data:[^;]+;base64,/, ""); }
function normalizeRatio(value: string, kind: MediaKind) {
  if (kind === "video") return value === "9:16" ? "9:16" : "16:9";
  return value;
}
function publicError(data: any) {
  const code = data?.error?.status;
  if (code === "UNAUTHENTICATED" || data?.error?.code === 401) return "A credencial informada não é uma API Key válida do Gemini. Gere uma nova chave no Google AI Studio e salve-a nas Configurações da Luna.";
  if (code === "RESOURCE_EXHAUSTED") return "O limite da API Gemini foi atingido. Tente novamente mais tarde.";
  if (code === "PERMISSION_DENIED") return "A chave não possui acesso ao modelo selecionado ou o faturamento não está ativo.";
  if (code === "INVALID_ARGUMENT") return "O Gemini rejeitou uma configuração da geração. Revise a imagem e o formato.";
  return data?.error?.message ?? "Não foi possível concluir a solicitação no Gemini.";
}
