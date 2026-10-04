"use server";

import { adminContext, guard, runAndReturn, safeReturnTo, uuidOrThrow, type ActionResult } from "@/lib/admin/server-utils";
import { AdminError } from "@/lib/admin/errors";
import { parseReviewForm, str } from "@/lib/admin/schemas";
import { createReview, deleteReview, setReviewStatus } from "@/lib/admin/mutations/content";

export async function addReviewAction(formData: FormData): Promise<ActionResult> {
  const { sb } = await adminContext();
  return guard(() => createReview(sb, parseReviewForm(formData)), "Review added as Pending. Approve it to show it on the website.");
}

export async function reviewStatusAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/reviews");
  const status = str(formData, "status");
  await runAndReturn(
    returnTo,
    async () => {
      if (status !== "pending" && status !== "approved" && status !== "rejected" && status !== "hidden") throw new AdminError("Invalid status.");
      await setReviewStatus(sb, uuidOrThrow(formData.get("id")), status);
    },
    status === "approved" ? "Review approved and shown on the website." : "Review updated.",
  );
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  const { sb } = await adminContext();
  const returnTo = safeReturnTo(formData.get("returnTo"), "/admin/reviews");
  await runAndReturn(returnTo, () => deleteReview(sb, uuidOrThrow(formData.get("id"))), "Review deleted.");
}
