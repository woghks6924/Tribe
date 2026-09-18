import { prisma } from "@/lib/prisma";

export { normalizeExternalUrl } from "@/lib/url";

export type RunningFormFieldType = "text" | "textarea" | "select" | "radio" | "checkbox";

export type RunningFormField = {
  id: string;
  label: string;
  description?: string; // 질문 아래에 보여줄 부가 설명(선택)
  type: RunningFormFieldType;
  required: boolean;
  options?: string[]; // select/radio/checkbox일 때만 사용
};

export type RunningFormCategory = "RANDOM_DRAW" | "FIRST_COME";

export type RunningFormStatus = "UPCOMING" | "OPEN" | "CLOSED";

export type RunningFormCollabBrand = {
  name: string;
  url: string;
};

export type RunningFormData = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  eventDate: string;
  category: RunningFormCategory;
  noticeContent: string | null;
  providedItems: string | null;
  entryFee: number | null;
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
  createdAt: string;
};

type PrismaRunningForm = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  eventDate: Date;
  category: string;
  noticeContent: string | null;
  providedItems: string | null;
  entryFee: number | null;
  capacity: number | null;
  applicationStartAt: Date | null;
  applicationEndAt: Date | null;
  status: string;
  isPublished: boolean;
  privacyItems: string;
  privacyPurpose: string;
  privacyRetention: string;
  collabBrands: unknown;
  fields: unknown;
  createdAt: Date;
};

export function toRunningFormData(f: PrismaRunningForm): RunningFormData {
  return {
    id: f.id,
    title: f.title,
    thumbnailUrl: f.thumbnailUrl,
    eventDate: f.eventDate.toISOString(),
    category: f.category as RunningFormCategory,
    noticeContent: f.noticeContent,
    providedItems: f.providedItems,
    entryFee: f.entryFee,
    capacity: f.capacity,
    applicationStartAt: f.applicationStartAt ? f.applicationStartAt.toISOString() : null,
    applicationEndAt: f.applicationEndAt ? f.applicationEndAt.toISOString() : null,
    status: f.status as RunningFormStatus,
    isPublished: f.isPublished,
    privacyItems: f.privacyItems,
    privacyPurpose: f.privacyPurpose,
    privacyRetention: f.privacyRetention,
    collabBrands: Array.isArray(f.collabBrands) ? (f.collabBrands as RunningFormCollabBrand[]) : [],
    fields: Array.isArray(f.fields) ? (f.fields as RunningFormField[]) : [],
    createdAt: f.createdAt.toISOString(),
  };
}

// 관리자가 수동으로 마감 처리했거나, 신청기간을 벗어났거나, (선착순일 때만) 정원이
// 다 찼으면 실질적으로 마감(또는 아직 예정)으로 취급한다. status 필드 자체는 크론이
// 나중에 따라잡을 때까지 그대로일 수 있어 항상 이 함수를 통해 "지금 실제로 신청
// 가능한지"를 판단한다.
// 랜덤추첨은 정원이 "뽑을 인원 수"일 뿐 신청 상한이 아니므로, 정원이 차도 마감하지
// 않고 신청기간 종료까지 계속 접수를 받는다.
export function getEffectiveRunningFormStatus(
  form: {
    status: RunningFormStatus;
    category: RunningFormCategory;
    capacity: number | null;
    applicationStartAt?: Date | string | null;
    applicationEndAt?: Date | string | null;
  },
  submissionCount: number,
): RunningFormStatus {
  if (form.status === "CLOSED") return "CLOSED";
  const now = new Date();
  if (form.applicationEndAt && now > new Date(form.applicationEndAt)) return "CLOSED";
  if (form.applicationStartAt && now < new Date(form.applicationStartAt)) return "UPCOMING";
  if (form.status === "UPCOMING") return "UPCOMING";
  if (
    form.category === "FIRST_COME" &&
    form.capacity != null &&
    submissionCount >= form.capacity
  ) {
    return "CLOSED";
  }
  return "OPEN";
}

export async function getPublishedRunningForms(): Promise<
  (RunningFormData & { submissionCount: number })[]
> {
  const forms = await prisma.runningForm.findMany({
    where: { isPublished: true },
    orderBy: { eventDate: "asc" },
    include: { _count: { select: { submissions: true } } },
  });
  return forms.map((f) => ({ ...toRunningFormData(f), submissionCount: f._count.submissions }));
}

export async function getPublishedRunningForm(
  id: string,
): Promise<(RunningFormData & { submissionCount: number }) | null> {
  const form = await prisma.runningForm.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true } } },
  });
  if (!form || !form.isPublished) return null;
  return { ...toRunningFormData(form), submissionCount: form._count.submissions };
}
