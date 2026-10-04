import type { BadgeTone } from "@/components/ui/badge";

export const STATUS_LABELS: Record<string, string> = {
  new_enquiry: "New enquiry",
  contacted: "Contacted",
  availability_confirmed: "Availability confirmed",
  awaiting_customer_decision: "Awaiting customer decision",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONES: Record<string, BadgeTone> = {
  new_enquiry: "gold",
  contacted: "neutral",
  availability_confirmed: "neutral",
  awaiting_customer_decision: "neutral",
  confirmed: "success",
  processing: "success",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
};
