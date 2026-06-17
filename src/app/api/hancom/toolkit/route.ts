import { NextResponse } from "next/server";
import { getHancomToolkitCatalog } from "@/lib/hancom/hancomToolkitService";

export async function GET() {
  const catalog = await getHancomToolkitCatalog();
  return NextResponse.json({
    ...catalog,
    toolkit: "hancom-toolkit (web port)",
    reference: "https://github.com/shinkang888-code/hancom-toolkit",
  });
}
