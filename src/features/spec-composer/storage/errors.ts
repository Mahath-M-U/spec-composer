import { toast } from "sonner";
import { isQuotaError } from "@/lib/storage/local";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/** Reports a failed storage operation and tells the user once per burst. */
export function reportStorageError(error: unknown, op: string) {
  reportLovableError(error, { area: "storage", op });
  if (isQuotaError(error))
    toast.error("Browser storage is full", {
      id: "storage-quota",
      description: "Delete old designs to keep saving changes.",
    });
  else
    toast.error("Couldn't save your changes", {
      id: "storage-error",
      description: "Your work is still open. Try again in a moment.",
    });
}
