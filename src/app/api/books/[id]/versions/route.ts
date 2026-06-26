import { NextResponse } from "next/server";
import { getBookStructure } from "@/lib/chapterService";
import { getDataBackend } from "@/lib/dbMode";
import { createBookVersionNeon, listBookVersionsNeon } from "@/lib/neonBookStore";
import { getSupabaseAdmin } from "@/lib/supabaseClient";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const backend = getDataBackend();
    if (backend === "local") {
      return NextResponse.json({ versions: [] });
    }

    if (backend === "neon") {
      const versions = await listBookVersionsNeon(id);
      return NextResponse.json({ versions });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ versions: [] });

    const { data, error } = await admin
      .from("book_versions")
      .select("id, label, created_at")
      .eq("book_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return NextResponse.json({ versions: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "버전 조회 실패" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { label?: string };
    const structure = await getBookStructure(id);
    if (!structure) {
      return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
    }

    const backend = getDataBackend();
    if (backend === "local") {
      return NextResponse.json({ ok: true, local: true, message: "로컬 모드 — 버전은 원격 DB에서만 저장됩니다." });
    }

    const label = body.label?.trim() || `스냅샷 ${new Date().toLocaleString("ko-KR")}`;

    if (backend === "neon") {
      const version = await createBookVersionNeon(id, structure, label);
      return NextResponse.json({ version });
    }

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Supabase 연결 실패");

    const { data, error } = await admin
      .from("book_versions")
      .insert({
        book_id: id,
        snapshot: structure,
        label,
      })
      .select("id, label, created_at")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ version: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "버전 저장 실패" },
      { status: 500 },
    );
  }
}
