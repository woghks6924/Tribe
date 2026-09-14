import { RunningFormBuilder } from "@/components/admin/running-form-builder";

export default function NewRunningFormPage() {
  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">New Running Form</h1>
      <RunningFormBuilder />
    </div>
  );
}
