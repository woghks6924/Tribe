import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toRunningFormData } from "@/lib/running";
import { RunningFormBuilder } from "@/components/admin/running-form-builder";

export const dynamic = "force-dynamic";

export default async function EditRunningFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await prisma.runningForm.findUnique({ where: { id } });
  if (!form) notFound();

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Edit Running Form</h1>
      <RunningFormBuilder initial={toRunningFormData(form)} />
    </div>
  );
}
