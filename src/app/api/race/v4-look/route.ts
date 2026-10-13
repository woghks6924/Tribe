import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { PALETTE as LEGACY_PALETTE } from "@/lib/race/constants";
import { normalizeAndValidateIgHandle } from "@/lib/race/validate";
import { HAIR_NAMES, PALETTE } from "@/lib/race/v4/palette";

type Body = {
  hairStyle?: string | null;
  topColor?: string;
  bottomColor?: string;
  shoesColor?: string;
  hairColor?: string;
  bibNumber?: number | null;
  igHandle?: string;
};

const HAIR_IDS = new Set(HAIR_NAMES.map(([id]) => id).filter((id): id is string => id !== null));

// 새 캐릭터(v4) 외형 저장 — 로그인한 본인 것만 바꾼다. 헤어는 전부 무료, 장비는 여기서 안 건드린다(옷장 API가 담당).
export async function PUT(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as Body;
  const member = await prisma.raceMember.findUnique({ where: { id: session.sub } });
  if (!member) return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });

  const hairStyle = body.hairStyle ?? null;
  if (hairStyle !== null && !HAIR_IDS.has(hairStyle)) {
    return NextResponse.json({ error: "헤어 옵션이 올바르지 않아요." }, { status: 400 });
  }

  // 색은 v4 팔레트 8색 + 기존 대표색 12색 + 지금 저장돼 있는 값만 허용한다(백필된 상의색이 기존 12색이라서).
  const allowed = (part: keyof typeof PALETTE, current: string) =>
    new Set<string>([...PALETTE[part], ...LEGACY_PALETTE, current]);
  const pick = (part: keyof typeof PALETTE, value: string | undefined, current: string): string | null => {
    const v = value ?? current;
    return allowed(part, current).has(v) ? v : null;
  };
  const topColor = pick("top", body.topColor, member.topColor);
  const bottomColor = pick("bottom", body.bottomColor, member.bottomColor);
  const shoesColor = pick("shoes", body.shoesColor, member.shoesColor);
  const hairColor = pick("hair", body.hairColor, member.hairColor);
  if (!topColor || !bottomColor || !shoesColor || !hairColor) {
    return NextResponse.json({ error: "색상 옵션이 올바르지 않아요." }, { status: 400 });
  }

  const bibNumber = body.bibNumber ?? null;
  if (bibNumber !== null && !(Number.isInteger(bibNumber) && bibNumber >= 0 && bibNumber <= 99)) {
    return NextResponse.json({ error: "배번은 0~99 사이 숫자만 쓸 수 있어요." }, { status: 400 });
  }

  let igHandle: string | null | undefined;
  if (body.igHandle !== undefined) {
    const ig = normalizeAndValidateIgHandle(body.igHandle);
    if (!ig.ok) {
      return NextResponse.json({ error: "인스타그램 아이디는 영문, 숫자, 마침표, 밑줄만 쓸 수 있어요." }, { status: 400 });
    }
    igHandle = ig.value || null;
  }

  await prisma.raceMember.update({
    where: { id: session.sub },
    data: {
      hairStyle,
      topColor,
      bottomColor,
      shoesColor,
      hairColor,
      bibNumber,
      ...(igHandle !== undefined ? { igHandle } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
