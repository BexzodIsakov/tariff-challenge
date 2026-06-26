import { ActivateForm } from "@/components/activate-form";
import { requireAuth } from "@/lib/auth";

export default async function ActivatePage() {
  await requireAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Activate your access</h1>
      <ActivateForm />
    </div>
  );
}
