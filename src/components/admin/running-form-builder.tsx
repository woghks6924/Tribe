"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeExternalUrl } from "@/lib/url";
import type {
  RunningFormCategory,
  RunningFormCollabBrand,
  RunningFormField,
  RunningFormFieldType,
  RunningFormStatus,
} from "@/lib/running";

type FieldInput = {
  id: string;
  label: string;
  description: string;
  type: RunningFormFieldType;
  required: boolean;
  optionsText: string; // 줄바꿈으로 구분한 선택지
};

const STATUS_LABEL: Record<RunningFormStatus, string> = {
  UPCOMING: "예정",
  OPEN: "진행중",
  CLOSED: "마감",
};

type BrandInput = {
  id: string;
  name: string;
  url: string;
};

function emptyBrand(): BrandInput {
  return { id: crypto.randomUUID(), name: "", url: "" };
}

const FIELD_TYPE_LABEL: Record<RunningFormFieldType, string> = {
  text: "단답형",
  textarea: "장문형",
  select: "드롭다운",
  radio: "객관식(단일)",
  checkbox: "체크박스(복수)",
};

function emptyField(): FieldInput {
  return {
    id: crypto.randomUUID(),
    label: "",
    description: "",
    type: "text",
    required: false,
    optionsText: "",
  };
}

// 새 폼을 만들 때 미리 채워두는 기본 질문 — 다른 질문처럼 그대로 삭제할 수 있다.
function defaultFields(): FieldInput[] {
  return [
    {
      id: crypto.randomUUID(),
      label: "Tri.be_seoul 계정을 팔로우하셨나요?",
      description: "",
      type: "checkbox",
      required: true,
      optionsText: "팔로우 완료",
    },
    {
      id: crypto.randomUUID(),
      label: "세션 중 촬영 사진 마케팅 활용 동의",
      description: "",
      type: "radio",
      required: true,
      optionsText: "동의합니다\n동의하지 않습니다",
    },
  ];
}

function fieldsToInput(fields: RunningFormField[]): FieldInput[] {
  return fields.map((f) => ({
    id: f.id,
    label: f.label,
    description: f.description ?? "",
    type: f.type,
    required: f.required,
    optionsText: (f.options ?? []).join("\n"),
  }));
}

export type RunningFormInitial = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  eventDate: string;
  category: RunningFormCategory;
  noticeContent: string | null;
  providedItems: string | null;
  entryFee: number | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  capacity: number | null;
  applicationStartAt: string | null;
  applicationEndAt: string | null;
  status: RunningFormStatus;
  isPublished: boolean;
  privacyItems: string;
  privacyPurpose: string;
  privacyRetention: string;
  collabBrands: RunningFormCollabBrand[];
  fields: RunningFormField[];
};

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RunningFormBuilder({ initial }: { initial?: RunningFormInitial }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [eventDate, setEventDate] = useState(
    initial ? toLocalInputValue(initial.eventDate) : "",
  );
  const [category, setCategory] = useState<RunningFormCategory>(initial?.category ?? "FIRST_COME");
  const [noticeContent, setNoticeContent] = useState(initial?.noticeContent ?? "");
  const [providedItems, setProvidedItems] = useState(initial?.providedItems ?? "");
  const [entryFee, setEntryFee] = useState(initial?.entryFee != null ? String(initial.entryFee) : "");
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initial?.bankAccountNumber ?? "");
  const [bankAccountHolder, setBankAccountHolder] = useState(initial?.bankAccountHolder ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : "");
  const [applicationStartAt, setApplicationStartAt] = useState(
    initial?.applicationStartAt ? toLocalInputValue(initial.applicationStartAt) : "",
  );
  const [applicationEndAt, setApplicationEndAt] = useState(
    initial?.applicationEndAt ? toLocalInputValue(initial.applicationEndAt) : "",
  );
  const [status, setStatus] = useState<RunningFormStatus>(initial?.status ?? "UPCOMING");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [privacyItems, setPrivacyItems] = useState(initial?.privacyItems ?? "이름, 연락처");
  const [privacyPurpose, setPrivacyPurpose] = useState(
    initial?.privacyPurpose ?? "이벤트 진행 및 당첨 안내",
  );
  const [privacyRetention, setPrivacyRetention] = useState(
    initial?.privacyRetention ?? "행사 종료 후 파기",
  );
  const [brands, setBrands] = useState<BrandInput[]>(
    initial?.collabBrands.length
      ? initial.collabBrands.map((b) => ({ id: crypto.randomUUID(), name: b.name, url: b.url }))
      : [],
  );
  const [fields, setFields] = useState<FieldInput[]>(
    initial ? fieldsToInput(initial.fields) : defaultFields(),
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "running-forms");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setThumbnailUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateField(id: string, patch: Partial<FieldInput>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addField() {
    setFields((prev) => [...prev, emptyField()]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function moveField(id: string, direction: -1 | 1) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateBrand(id: string, patch: Partial<BrandInput>) {
    setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function addBrand() {
    setBrands((prev) => [...prev, emptyBrand()]);
  }

  function removeBrand(id: string) {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !eventDate) {
      setError("제목과 이벤트 날짜를 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        thumbnailUrl: thumbnailUrl || undefined,
        eventDate: new Date(eventDate).toISOString(),
        category,
        noticeContent: noticeContent || undefined,
        providedItems: providedItems || undefined,
        entryFee: entryFee ? Number(entryFee) : undefined,
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountHolder: bankAccountHolder.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        applicationStartAt: applicationStartAt ? new Date(applicationStartAt).toISOString() : undefined,
        applicationEndAt: applicationEndAt ? new Date(applicationEndAt).toISOString() : undefined,
        status,
        isPublished,
        privacyItems: privacyItems.trim() || undefined,
        privacyPurpose: privacyPurpose.trim() || undefined,
        privacyRetention: privacyRetention.trim() || undefined,
        collabBrands: brands
          .filter((b) => b.name.trim() && b.url.trim())
          .map((b): RunningFormCollabBrand => ({
            name: b.name.trim(),
            url: normalizeExternalUrl(b.url),
          })),
        fields: fields
          .filter((f) => f.label.trim())
          .map((f): RunningFormField => ({
            id: f.id,
            label: f.label.trim(),
            description: f.description.trim() || undefined,
            type: f.type,
            required: f.required,
            options:
              f.type === "select" || f.type === "radio" || f.type === "checkbox"
                ? f.optionsText.split("\n").map((o) => o.trim()).filter(Boolean)
                : undefined,
          })),
      };

      const res = await fetch(
        initial ? `/api/admin/running-forms/${initial.id}` : "/api/admin/running-forms",
        {
          method: initial ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/admin/running-forms");
      router.refresh();
    } catch {
      setError("문제가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <input
        required
        placeholder="이벤트 제목 (예: 9월 나이트런)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">썸네일</span>
        {thumbnailUrl && (
          <div className="relative h-40 w-full max-w-xs overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-fit cursor-pointer border border-line-strong px-4 py-2 text-xs uppercase hover:border-ink hover:text-ink"
        >
          {uploading ? "업로드 중..." : thumbnailUrl ? "이미지 교체" : "이미지 업로드"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleThumbnailUpload}
          className="hidden"
        />
      </div>

      <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
        이벤트 날짜/시간
        <input
          required
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">카테고리</span>
        <div className="flex border border-line-strong">
          {(["FIRST_COME", "RANDOM_DRAW"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`flex-1 cursor-pointer px-4 py-2 text-xs uppercase ${
                category === c ? "bg-ink text-[color:var(--color-base)]" : "text-ink-muted hover:text-ink"
              }`}
            >
              {c === "FIRST_COME" ? "선착순" : "랜덤추첨"}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="공지 내용 (선택)"
        value={noticeContent}
        onChange={(e) => setNoticeContent(e.target.value)}
        rows={4}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
      />

      <textarea
        placeholder={"제공 사항 (선택)\n예: 기념품, 생수, 넘버택 제공"}
        value={providedItems}
        onChange={(e) => setProvidedItems(e.target.value)}
        rows={3}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
      />

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
          참가비 (원, 비워두면 무료)
          <input
            type="number"
            min="0"
            placeholder="예: 10000"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none placeholder:text-ink-faint"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
          정원 (비워두면 무제한)
          <input
            type="number"
            min="1"
            placeholder="예: 30"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>

      {entryFee && (
        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
            입금 은행
            <input
              placeholder="예: 카카오뱅크"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none placeholder:text-ink-faint"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
            계좌번호
            <input
              placeholder="예: 3333-01-1234567"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none placeholder:text-ink-faint"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
            예금주
            <input
              placeholder="예: 홍길동"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
              className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none placeholder:text-ink-faint"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
          신청 시작일시 (비워두면 즉시 시작)
          <input
            type="datetime-local"
            value={applicationStartAt}
            onChange={(e) => setApplicationStartAt(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
          신청 마감일시 (비워두면 수동 마감)
          <input
            type="datetime-local"
            value={applicationEndAt}
            onChange={(e) => setApplicationEndAt(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none"
          />
        </label>
      </div>
      <p className="-mt-3 text-xs text-ink-faint">
        마감일시가 지나면 신청이 자동으로 막히고, 아래 진행 상태도 자동으로 마감으로 바뀝니다.
      </p>

      <div className="flex flex-col gap-3">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">콜라보 브랜드 (선택, 여러 개 가능)</span>
        {brands.map((b) => (
          <div key={b.id} className="flex gap-2">
            <input
              placeholder="브랜드명"
              value={b.name}
              onChange={(e) => updateBrand(b.id, { name: e.target.value })}
              className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
            />
            <input
              placeholder="팔로우 링크"
              value={b.url}
              onChange={(e) => updateBrand(b.id, { url: e.target.value })}
              className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
            />
            <button
              type="button"
              onClick={() => removeBrand(b.id)}
              className="cursor-pointer px-2 text-ink-faint hover:text-red-400"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBrand}
          className="w-fit cursor-pointer border border-line-strong px-4 py-2 text-xs uppercase text-ink-muted hover:border-ink hover:text-ink"
        >
          + 브랜드 추가
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">진행 상태</span>
        <div className="flex border border-line-strong">
          {(["UPCOMING", "OPEN", "CLOSED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 cursor-pointer px-4 py-2 text-xs uppercase ${
                status === s ? "bg-ink text-[color:var(--color-base)]" : "text-ink-muted hover:text-ink"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-xs text-ink-muted">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        공개 (published)
      </label>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">
          개인정보 수집·이용 동의 안내
        </span>
        <label className="flex flex-col gap-1.5 text-xs text-ink-faint">
          수집 및 이용 항목
          <input
            value={privacyItems}
            onChange={(e) => setPrivacyItems(e.target.value)}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-ink-faint">
          수집 및 이용 목적
          <input
            value={privacyPurpose}
            onChange={(e) => setPrivacyPurpose(e.target.value)}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-ink-faint">
          보유 및 이용 기간
          <input
            value={privacyRetention}
            onChange={(e) => setPrivacyRetention(e.target.value)}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-faint normal-case">신청 폼에 실제로 보이는 모습</span>
          <div className="flex flex-col gap-3 border border-line-strong bg-base p-4 normal-case">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-ink">
                <span className="text-red-500">*</span> 개인정보 수집 및 이용 동의
              </span>
              <span className="text-xs text-ink-faint">
                동의하지 않을 경우, 신청이 제한될 수 있습니다.
              </span>
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-3 text-xs">
              <div className="flex items-baseline justify-between gap-4">
                <span className="shrink-0 text-ink-faint">수집 및 이용 항목</span>
                <span className="text-right font-semibold text-ink">{privacyItems}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="shrink-0 text-ink-faint">수집 및 이용 목적</span>
                <span className="text-right font-semibold text-ink">{privacyPurpose}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="shrink-0 text-ink-faint">보유 및 이용 기간</span>
                <span className="text-right font-semibold text-red-500">{privacyRetention}</span>
              </div>
            </div>
            <div className="flex items-center justify-center border border-line-strong px-4 py-3 text-sm font-bold text-ink-muted">
              동의합니다
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">설문 항목</span>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-faint">기본 항목 (모든 폼에 자동 포함, 삭제 불가)</span>
          <div className="flex flex-wrap gap-2">
            {["이름", "성별", "휴대폰번호", "인스타그램 ID"].map((label) => (
              <span
                key={label}
                className="border border-line-strong bg-base-elevated px-3 py-1.5 text-xs text-ink-muted"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="flex flex-col gap-2 border border-line-strong p-3">
            <div className="flex items-center gap-2">
              <input
                placeholder="질문 (예: 러닝화 사이즈)"
                value={f.label}
                onChange={(e) => updateField(f.id, { label: e.target.value })}
                className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
              />
              <select
                value={f.type}
                onChange={(e) => updateField(f.id, { type: e.target.value as RunningFormFieldType })}
                className="border border-line-strong bg-base px-2 py-2 text-xs outline-none"
              >
                {(Object.keys(FIELD_TYPE_LABEL) as RunningFormFieldType[]).map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <label className="flex shrink-0 items-center gap-1 text-xs text-ink-faint">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => updateField(f.id, { required: e.target.checked })}
                />
                필수
              </label>
              <button
                type="button"
                onClick={() => moveField(f.id, -1)}
                disabled={i === 0}
                className="cursor-pointer px-1 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveField(f.id, 1)}
                disabled={i === fields.length - 1}
                className="cursor-pointer px-1 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeField(f.id)}
                className="cursor-pointer px-1.5 text-xs text-ink-faint hover:text-red-400"
              >
                ×
              </button>
            </div>
            <textarea
              placeholder="부가 설명 (선택 — 질문 아래에 작게 표시됩니다)"
              value={f.description}
              onChange={(e) => updateField(f.id, { description: e.target.value })}
              rows={2}
              className="border border-line-strong bg-transparent px-3 py-2 text-xs outline-none placeholder:text-ink-faint"
            />
            {(f.type === "select" || f.type === "radio" || f.type === "checkbox") && (
              <textarea
                placeholder={"선택지 (줄바꿈으로 구분)\n예: S\nM\nL"}
                value={f.optionsText}
                onChange={(e) => updateField(f.id, { optionsText: e.target.value })}
                rows={3}
                className="border border-line-strong bg-transparent px-3 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addField}
          className="w-fit cursor-pointer border border-line-strong px-4 py-2 text-xs uppercase text-ink-muted hover:border-ink hover:text-ink"
        >
          + 질문 추가
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit cursor-pointer bg-ink px-6 py-3 text-xs font-semibold tracking-[0.08em] text-[color:var(--color-base)] uppercase hover:bg-ink/85 disabled:opacity-40"
      >
        {saving ? "저장 중..." : initial ? "수정 저장" : "폼 만들기"}
      </button>
    </form>
  );
}
