"use client";

import { useMemo, useState } from "react";

export type RunningMessageFormInfo = {
  title: string;
  eventDate: string;
  entryFee: number | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  capacity: number | null;
  providedItems: string | null;
  location: string | null;
  luggageInfo: string | null;
  noticeContent: string | null;
  collabBrands: { name: string; url: string }[];
};

type Section = {
  key: string;
  label: string;
  defaultChecked: boolean;
  // 같은 group인 섹션끼리는 줄바꿈 하나로, group이 바뀌면 빈 줄 하나를 두고 이어붙인다
  // (예: 일시/집결지/참가비 같은 불릿들은 한 덩어리로 붙어야 자연스러운 안내문이 된다).
  group: string;
  build: (form: RunningMessageFormInfo) => string | null;
};

// 세션마다 거의 항상 같은 계좌를 쓰길래, 폼에 계좌를 안 채워놨어도 문자에는 이 계좌가
// 나가도록 기본값으로 둔다. 특정 세션만 다른 계좌를 쓰고 싶으면 폼의 계좌 필드를 채우면
// 그 값이 우선한다.
const DEFAULT_BANK = { name: "카카오뱅크", accountNumber: "3333-01-1142378", holder: "김재환" };

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
    group: "intro",
    build: (f) => `안녕하세요, Tribe입니다 \n[${f.title}] 세션 당첨 안내드립니다.`,
  },
  {
    key: "eventDate",
    label: "일시",
    defaultChecked: true,
    group: "details",
    build: (f) => `* 일시: ${formatEventDate(f.eventDate)}`,
  },
  {
    key: "location",
    label: "집결지",
    defaultChecked: true,
    group: "details",
    build: (f) => (f.location?.trim() ? `* 집결지: ${f.location.trim()}` : null),
  },
  {
    key: "entryFee",
    label: "참가비",
    defaultChecked: true,
    group: "details",
    build: (f) => `* 참가비: ${f.entryFee != null ? `${f.entryFee.toLocaleString()}원` : "무료"}`,
  },
  {
    key: "providedItems",
    label: "제공 사항",
    defaultChecked: true,
    group: "details",
    build: (f) => (f.providedItems?.trim() ? `* 제공 사항: ${f.providedItems.trim()}` : null),
  },
  {
    key: "luggageInfo",
    label: "짐 보관",
    defaultChecked: true,
    group: "details",
    build: (f) => (f.luggageInfo?.trim() ? `* 짐 보관: ${f.luggageInfo.trim()}` : null),
  },
  {
    key: "capacity",
    label: "정원",
    defaultChecked: false,
    group: "details",
    build: (f) => (f.capacity != null ? `* 정원: ${f.capacity}명` : null),
  },
  {
    key: "collabBrands",
    label: "콜라보 브랜드",
    defaultChecked: false,
    group: "details",
    build: (f) =>
      f.collabBrands.length > 0
        ? `* 콜라보 브랜드: ${f.collabBrands.map((b) => b.name).join(", ")}`
        : null,
  },
  {
    key: "bankAccount",
    label: "입금 계좌 안내",
    defaultChecked: true,
    group: "payment",
    build: (f) => {
      if (f.entryFee == null) return null;
      const name = f.bankName || DEFAULT_BANK.name;
      const number = f.bankAccountNumber || DEFAULT_BANK.accountNumber;
      const holder = f.bankAccountHolder || DEFAULT_BANK.holder;
      return [
        "입금 계좌",
        `${name} ${number}${holder ? ` ${holder}` : ""}`,
        `참가비는 입금하시고 "입금완료"회신부탁드립니다.`,
        "해당 시간에 참여가 어려우신 경우, 다른 분들이 참여하실 수 있도록 빠른 회신 부탁드립니다.",
      ].join("\n");
    },
  },
  {
    key: "noticeContent",
    label: "공지 내용 전체",
    defaultChecked: false,
    group: "notice",
    build: (f) => (f.noticeContent?.trim() ? f.noticeContent.trim() : null),
  },
  {
    key: "closing",
    label: "마무리 인사",
    defaultChecked: true,
    group: "closing",
    build: () => "감사합니다.",
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

  const message = useMemo(() => {
    const active = availableSections.filter((s) => checked[s.key]);
    const blocks: string[] = [];
    let currentGroup: string | null = null;
    let buffer: string[] = [];
    for (const s of active) {
      if (s.group !== currentGroup && buffer.length > 0) {
        blocks.push(buffer.join("\n"));
        buffer = [];
      }
      currentGroup = s.group;
      buffer.push(s.text!);
    }
    if (buffer.length > 0) blocks.push(buffer.join("\n"));
    return blocks.join("\n\n");
  }, [availableSections, checked]);

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
