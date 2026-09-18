import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEffectiveRunningFormStatus, getPublishedRunningForm, normalizeExternalUrl } from "@/lib/running";
import { RunningSignupForm } from "@/components/running/running-signup-form";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = { RANDOM_DRAW: "랜덤추첨", FIRST_COME: "선착순" } as const;
const STATUS_LABEL = { UPCOMING: "예정", OPEN: "진행중", CLOSED: "마감" } as const;
const STATUS_BADGE = {
  UPCOMING: "bg-white/90 text-ink",
  OPEN: "bg-accent text-accent-ink",
  CLOSED: "bg-black/70 text-white",
} as const;

function formatApplicationPeriod(startAt: string | null, endAt: string | null): string | null {
  if (!startAt && !endAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    });
  if (startAt && endAt) return `${fmt(startAt)} ~ ${fmt(endAt)}`;
  if (endAt) return `~ ${fmt(endAt)} 마감`;
  return `${fmt(startAt!)} 부터`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const form = await getPublishedRunningForm(id);
  return { title: form ? `${form.title} — Tri.be Running` : "Tri.be Running" };
}

export default async function RunningFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await getPublishedRunningForm(id);
  if (!form) notFound();

  const status = getEffectiveRunningFormStatus(form, form.submissionCount);
  const isPastEvent = new Date(form.eventDate) < new Date();

  return (
    <div className="mx-auto flex max-w-xl flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-base-elevated">
        {form.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span
          className={`absolute top-4 left-4 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase ${STATUS_BADGE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-col gap-6 px-5 py-8 sm:px-10">
        <div className="flex flex-col gap-2">
          <span className="w-fit border border-line-strong px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-ink-muted uppercase">
            {CATEGORY_LABEL[form.category]}
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-[0.01em] uppercase sm:text-3xl">
            {form.title}
          </h1>
          <span className="text-sm text-ink-muted">
            {new Date(form.eventDate).toLocaleString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Seoul",
            })}
          </span>
          <span className="text-xs text-ink-faint">
            참가비 {form.entryFee != null ? `${form.entryFee.toLocaleString()}원` : "무료"}
            {form.capacity != null ? ` · 정원 ${form.capacity}명` : ""}
          </span>
          {form.entryFee != null && form.bankName && form.bankAccountNumber && (
            <span className="text-xs text-ink-faint">
              입금계좌 {form.bankName} {form.bankAccountNumber}
              {form.bankAccountHolder ? ` (예금주 ${form.bankAccountHolder})` : ""}
            </span>
          )}
          {formatApplicationPeriod(form.applicationStartAt, form.applicationEndAt) && (
            <span className="text-xs text-ink-faint">
              신청기간 {formatApplicationPeriod(form.applicationStartAt, form.applicationEndAt)}
            </span>
          )}
        </div>

        {form.noticeContent && (
          <p className="border-t border-line pt-5 text-sm whitespace-pre-line text-ink-muted">
            {form.noticeContent}
          </p>
        )}

        {form.providedItems && (
          <div className="flex flex-col gap-1.5 border-t border-line pt-5">
            <span className="text-xs tracking-[0.08em] text-ink-faint uppercase">제공 사항</span>
            <p className="text-sm whitespace-pre-line text-ink-muted">{form.providedItems}</p>
          </div>
        )}

        {form.collabBrands.length > 0 && (
          <div className="flex flex-col gap-2">
            {form.collabBrands.map((brand, i) => (
              <a
                key={i}
                href={normalizeExternalUrl(brand.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-line-strong px-4 py-3 text-sm hover:border-ink"
              >
                <span>
                  콜라보 브랜드 <span className="font-semibold">{brand.name}</span> 팔로우하기
                </span>
                <span aria-hidden>→</span>
              </a>
            ))}
          </div>
        )}

        {isPastEvent && form.photoAlbumUrl && (
          <a
            href={normalizeExternalUrl(form.photoAlbumUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between border border-line-strong px-4 py-3 text-sm hover:border-ink"
          >
            <span className="font-semibold">세션 사진 다운받기</span>
            <span aria-hidden>→</span>
          </a>
        )}

        <RunningSignupForm
          formId={form.id}
          fields={form.fields}
          status={status}
          privacyItems={form.privacyItems}
          privacyPurpose={form.privacyPurpose}
          privacyRetention={form.privacyRetention}
        />
      </div>
    </div>
  );
}
