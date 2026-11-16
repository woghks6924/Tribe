import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RunningFormField } from "@/lib/running";
import { normalizeInstagram, normalizePhone, sanitizeAnswers, validateAnswers } from "@/lib/running-validate";

// 참가자 본인의 신청 내용(설문 답변) 수정.
// 로그인이 없는 폼이라, 신청할 때 쓴 "휴대폰번호 + 인스타그램 ID"가 둘 다 일치할 때만 본인으로 본다.
// 고칠 수 있는 건 설문 답변뿐이고(이름·연락처는 중복 신청 확인에 쓰여서 제외), 아래 조건에서만 허용한다:
//  - 아직 당첨 전(대기) 상태이고
//  - 수정 마감 전(신청 마감일이 있으면 그 시각, 없으면 행사 시작 시각)

type Identity = { phone?: string; instagramId?: string };

// 같은 IP가 본인 확인에 계속 실패하면 잠시 막는다(남의 신청을 추측해서 찾아내는 걸 막으려는 최소한의 장치).
// 서버리스라 인스턴스마다 따로 세는 best-effort 방식이다.
const FAILS = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function clientKey(request: Request, formId: string) {
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  return `${formId}:${ip}`;
}
function isBlocked(key: string) {
  const f = FAILS.get(key);
  return !!f && f.resetAt > Date.now() && f.count >= MAX_FAILS;
}
function noteFail(key: string) {
  const now = Date.now();
  const f = FAILS.get(key);
  if (!f || f.resetAt <= now) FAILS.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else f.count += 1;
}

async function findOwn(formId: string, who: Identity) {
  const phone = normalizePhone(who.phone ?? "");
  const insta = normalizeInstagram(who.instagramId ?? "");
  if (!phone || !insta) return null;
  const subs = await prisma.runningSubmission.findMany({ where: { formId } });
  return (
    subs.find((s) => normalizePhone(s.phone) === phone && s.instagramId != null && normalizeInstagram(s.instagramId) === insta) ?? null
  );
}

function maskName(name: string) {
  const chars = [...name];
  if (chars.length <= 1) return name;
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

function editability(
  form: { isPublished: boolean; applicationEndAt: Date | null; eventDate: Date },
  status: string,
): { editable: boolean; reason: string | null; deadline: Date } {
  const deadline = form.applicationEndAt ?? form.eventDate;
  if (!form.isPublished) return { editable: false, reason: "수정할 수 없는 신청폼이에요.", deadline };
  if (status !== "PENDING") return { editable: false, reason: "이미 선정 절차가 진행되어 직접 수정할 수 없어요. 운영팀에 문의해 주세요.", deadline };
  if (Date.now() >= deadline.getTime()) return { editable: false, reason: "수정 가능 기간이 지났어요. 운영팀에 문의해 주세요.", deadline };
  return { editable: true, reason: null, deadline };
}

const NOT_FOUND = "일치하는 신청 내역을 찾을 수 없어요. 신청할 때 입력한 연락처와 인스타그램 ID를 확인해 주세요.";

// 본인 확인 + 현재 답변 조회
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = clientKey(request, id);
  if (isBlocked(key)) return NextResponse.json({ error: "시도 횟수가 많아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as Identity;
  const form = await prisma.runningForm.findUnique({ where: { id } });
  const sub = form && form.isPublished ? await findOwn(id, body) : null;
  if (!form || !sub) {
    noteFail(key);
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }
  const e = editability(form, sub.status);
  return NextResponse.json({
    name: maskName(sub.name),
    answers: sub.answers ?? {},
    editable: e.editable,
    reason: e.reason,
    deadline: e.deadline.toISOString(),
  });
}

// 답변 저장
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = clientKey(request, id);
  if (isBlocked(key)) return NextResponse.json({ error: "시도 횟수가 많아요. 잠시 후 다시 시도해 주세요." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as Identity & { answers?: unknown };
  const form = await prisma.runningForm.findUnique({ where: { id } });
  const sub = form && form.isPublished ? await findOwn(id, body) : null;
  if (!form || !sub) {
    noteFail(key);
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }
  const e = editability(form, sub.status);
  if (!e.editable) return NextResponse.json({ error: e.reason }, { status: 403 });

  const fields = Array.isArray(form.fields) ? (form.fields as RunningFormField[]) : [];
  const clean = sanitizeAnswers(fields, body.answers ?? {});
  if (!clean.ok) return NextResponse.json({ error: clean.error }, { status: 400 });
  const answerError = validateAnswers(fields, clean.answers);
  if (answerError) return NextResponse.json({ error: answerError }, { status: 400 });

  await prisma.runningSubmission.update({ where: { id: sub.id }, data: { answers: clean.answers } });
  return NextResponse.json({ ok: true });
}
