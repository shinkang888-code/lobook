import { streamCoworkReply, isCoworkAiEnabled } from "@/lib/aionui/coworkChatService";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    if (!isCoworkAiEnabled()) {
      return new Response(
        JSON.stringify({
          error: "Studio Chat API 키가 없습니다. OPENAI_API_KEY 또는 COWORK_AI_API_KEY를 설정하세요.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!body.message?.trim()) {
      return new Response(JSON.stringify({ error: "message가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await streamCoworkReply(id, body.message.trim(), body.history ?? []);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "채팅 실패" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
