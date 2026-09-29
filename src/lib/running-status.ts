// 서버/클라이언트 어디서든 import해도 안전하도록 lib/running.ts에서 분리해뒀다 — 저쪽은
// prisma(=pg, Node 전용)를 끌고 오기 때문에 클라이언트 컴포넌트에서 import하면 빌드가 깨진다.

export type RunningFormCategory = "RANDOM_DRAW" | "FIRST_COME";
export type RunningFormStatus = "UPCOMING" | "OPEN" | "CLOSED";

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
