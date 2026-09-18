"use client";

import { useMemo, useState } from "react";

export type RunningMessageFormInfo = {
  title: string;
  eventDate: string;
  entryFee: number | null;
  capacity: number | null;
  providedItems: string | null;
  noticeContent: string | null;
  collabBrands: { name: string; url: string }[];
};

type Section = {
  key: string;
  label: string;
  defaultChecked: boolean;
  build: (form: RunningMessageFormInfo) => string | null;
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

// 세션마다 매번 반복 작성하던 안내 문구를, 폼에 이미 입력된 정보로 자동 조립한다.
// 체크박스로 필요한 항목만 골라 넣고 복사해서 카톡/문자로 붙여넣는 용도.
const SECTIONS: Section[] = [
  {
    key: "greeting",
    label: "인사말 + 세션명",
    defaultChecked: true,
    build: (f) => `안녕하세요, Tri.be입니다 🏃\n[${f.title}] 세션 안내드립니다.`,
  },
  {
    key: "eventDate",
    label: "일시",
    defaultChecked: true,
    build: (f) => `일시: ${formatEventDate(f.eventDate)}`,
  },
  {
    key: "entryFee",
    label: "참가비",
    defaultChecked: true,
    build: (f) => `참가비: ${f.entryFee != null ? `${f.entryFee.toLocaleString()}원` : "무료"}`,
  },
  {
    key: "capacity",
    label: "정원",
    defaultChecked: false,
    build: (f) => (f.capacity != null ? `정원: ${f.capacity}명` : null),
  },
  {
    key: "providedItems",
    label: "제공 사항",
    defaultChecked: true,
    build: (f) => (f.providedItems?.trim() ? `제공 사항: ${f.providedItems.trim()}` : null),
  },
  {
    key: "noticeContent",
    label: "공지 내용 전체",
    defaultChecked: false,
    build: (f) => (f.noticeContent?.trim() ? f.noticeContent.trim() : null),
  },
  {
    key: "collabBrands",
    label: "콜라보 브랜드",
    defaultChecked: false,
    build: (f) =>
      f.collabBrands.length > 0
        ? `콜라보 브랜드: ${f.collabBrands.map((b) => b.name).join(", ")}`
        : null,
  },
  {
    key: "closing",
    label: "마무리 인사",
    defaultChecked: true,
    build: () => "궁금하신 점 있으시면 언제든 편하게 답장 주세요 :)",
  },
];

export function RunningMessageGenerator({ form }: { form: RunningMessageFormInfo }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, s.defaultChecked])),
  );
  const [copied, setCopied] = useState(false);

  const availableSections = useMemo(
    () => SECTIONS.map((s) => ({ ...s, text: s.build(form) })).filter((s) => s.text != null),
    [form],
  );

  const message = useMemo(
    () =>
      availableSections
        .filter((s) => checked[s.key])
        .map((s) => s.text)
        .join("\n\n"),
    [availableSections, checked],
  );

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-fit cursor-pointer border border-line-strong px-3 py-2 text-xs uppercase text-ink-muted hover:border-ink hover:text-ink"
      >
        {open ? "문자 생성 닫기" : "문자 생성하기"}
      </button>

      {open && (
        <div className="flex flex-col gap-3 border border-line-strong p-4">
          <div className="flex flex-wrap gap-3">
            {availableSections.map((s) => (
              <label key={s.key} className="flex items-center gap-1.5 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={checked[s.key] ?? false}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [s.key]: e.target.checked }))}
                />
                {s.label}
              </label>
            ))}
          </div>
          <textarea
            readOnly
            value={message}
            rows={8}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm whitespace-pre-wrap outline-none"
          />
          <button
            type="button"
            onClick={copyMessage}
            disabled={!message}
            className="w-fit cursor-pointer bg-ink px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[color:var(--color-base)] uppercase hover:bg-ink/85 disabled:opacity-40"
          >
            {copied ? "복사됨!" : "복사하기"}
          </button>
        </div>
      )}
    </div>
  );
}
