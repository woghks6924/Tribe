"use client";

import { CourseScene } from "@/components/race/v4/course-scene";
import type { Character, Pet } from "@/lib/race/v4/sprite";
import type { LabMember } from "./lab-shared";

export function LabCourse({
  members,
  getChar,
  getPet,
}: {
  members: LabMember[];
  getChar: (id: string) => Character;
  getPet: (id: string) => Pet | null;
}) {
  return (
    <CourseScene
      members={members.map((m) => ({ id: m.id, name: m.name, km: m.km, type: m.type, todayLogged: m.todayLogged, dotColor: m.legacy.color }))}
      getChar={getChar}
      getPet={getPet}
      description={`실제 시즌 참가자(총 ${members.length}명)가 자기 구간 배경에서 달려요. 처음엔 1등이 있는 구간이 열리고, 좌우 화살표·스와이프·아래 진행바로 구간을 옮겨요.`}
    />
  );
}
