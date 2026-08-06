import { NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promo";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; subtotal?: number };

  if (!body.code || typeof body.subtotal !== "number") {
    return NextResponse.json({ error: "code and subtotal are required." }, { status: 400 });
  }

  const result = await validatePromoCode(body.code, body.subtotal);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ discountAmount: result.discountAmount });
}
