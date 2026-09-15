import { prisma } from "@/lib/prisma";

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
  capacity: number | null;
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
  capacity: number | null;
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
    capacity: f.capacity,
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

// 관리자가 수동으로 마감 처리했거나 정원이 다 찼으면 실질적으로 마감으로 취급한다.
// (status가 아직 OPEN이어도 정원이 찼으면 신청은 막는다.)
export function getEffectiveRunningFormStatus(
  form: { status: RunningFormStatus; capacity: number | null },
  submissionCount: number,
): RunningFormStatus {
  if (form.status !== "OPEN") return form.status;
  if (form.capacity != null && submissionCount >= form.capacity) return "CLOSED";
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
