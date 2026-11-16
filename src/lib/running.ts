import { prisma } from "@/lib/prisma";
import { getEffectiveRunningFormStatus, type RunningFormCategory, type RunningFormStatus } from "@/lib/running-status";

export { normalizeExternalUrl } from "@/lib/url";
export { getEffectiveRunningFormStatus, type RunningFormCategory, type RunningFormStatus };

export type RunningFormFieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "item";

export type RunningFormField = {
  id: string;
  label: string;
  description?: string; // 질문 아래에 보여줄 부가 설명(선택)
  type: RunningFormFieldType;
  required: boolean;
  options?: string[]; // select/radio/checkbox일 때만 사용
  // type이 "item"(협찬 품목)일 때만 사용: label = 품목 이름, url = 품목 링크,
  // 신청자가 사이즈·색상을 고르거나(선택지가 있을 때) 직접 입력한다.
  url?: string;
  askSize?: boolean;
  askColor?: boolean;
  askLength?: boolean; // 기장 받기(기본 꺼짐)
  sizeOptions?: string[];
  colorOptions?: string[];
  lengthOptions?: string[];
  customSize?: boolean; // 선택지가 있어도 직접 입력 허용
  customColor?: boolean;
  customLength?: boolean;
};

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
  location: string | null;
  luggageInfo: string | null;
  photoAlbumUrl: string | null;
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
  location: string | null;
  luggageInfo: string | null;
  photoAlbumUrl: string | null;
  entryFee: number | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
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
    location: f.location,
    luggageInfo: f.luggageInfo,
    photoAlbumUrl: f.photoAlbumUrl,
    entryFee: f.entryFee,
    bankName: f.bankName,
    bankAccountNumber: f.bankAccountNumber,
    bankAccountHolder: f.bankAccountHolder,
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

export async function getPublishedRunningForms(): Promise<
  (RunningFormData & { submissionCount: number })[]
> {
  const forms = await prisma.runningForm.findMany({
    where: { isPublished: true },
    include: { _count: { select: { submissions: true } } },
  });
  const data = forms.map((f) => ({ ...toRunningFormData(f), submissionCount: f._count.submissions }));

  // 다가오는 세션은 가까운 날짜순으로 먼저, 지난 세션은 최근에 지난 순으로 그 아래에 배치한다.
  const now = Date.now();
  const upcoming = data
    .filter((f) => new Date(f.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const past = data
    .filter((f) => new Date(f.eventDate).getTime() < now)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  return [...upcoming, ...past];
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
