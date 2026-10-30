import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

// 구글 드라이브 폴더의 "파일명 -> 파일 ID" 목록을 가져온다.
// 한 번 배포해 둔 Apps Script 웹앱(scripts/race-photos/list_drive_files.gs)을 서버에서 호출하고,
// 웹앱 주소와 토큰은 환경변수(RACE_PHOTO_LISTER_URL / RACE_PHOTO_LISTER_TOKEN)에만 둔다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const event = await prisma.racePhotoEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "대회를 찾을 수 없어요." }, { status: 404 });

  const url = process.env.RACE_PHOTO_LISTER_URL;
  const token = process.env.RACE_PHOTO_LISTER_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      { error: "드라이브 연동이 아직 설정되지 않았어요(RACE_PHOTO_LISTER_URL/TOKEN). ids.csv를 직접 올려도 돼요." },
      { status: 503 },
    );
  }
  const folderId = /\/folders\/([A-Za-z0-9_-]+)/.exec(event.driveFolderUrl)?.[1];
  if (!folderId) {
    return NextResponse.json({ error: "드라이브 폴더 링크에서 폴더 ID를 찾지 못했어요. 링크 형식을 확인해 주세요." }, { status: 400 });
  }

  try {
    const res = await fetch(`${url}?folder=${encodeURIComponent(folderId)}&token=${encodeURIComponent(token)}`, {
      cache: "no-store",
      redirect: "follow",
    });
    const data = (await res.json()) as { files?: { name: string; id: string }[]; error?: string };
    if (!res.ok || data.error || !Array.isArray(data.files)) {
      return NextResponse.json({ error: `드라이브 목록을 가져오지 못했어요: ${data.error ?? res.status}` }, { status: 502 });
    }
    return NextResponse.json({ files: data.files });
  } catch {
    return NextResponse.json({ error: "드라이브 연동 서버에 연결하지 못했어요." }, { status: 502 });
  }
}
