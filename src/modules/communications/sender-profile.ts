import { z } from "zod";

const compactText = (min: number, max: number) => z.string().trim().min(min).max(max);

export const senderProfileInput = z.object({
  senderName: compactText(2, 160),
  senderEmail: z.string().trim().toLowerCase().email().max(254),
  companyName: compactText(2, 160),
  senderTitle: compactText(2, 160),
  replyTo: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal("")),
});

export type SenderProfileInput = z.infer<typeof senderProfileInput>;

export type SenderProfileStatus = "not_connected" | "connected" | "needs_reconnect" | "disabled";

export function senderProfileNeedsConnection(status: SenderProfileStatus) {
  return status !== "connected";
}

// OAuth tokens belong in an encrypted credential store, never in this profile
// row or in client-visible API responses. A profile remains editable even while
// its Gmail connection is disconnected.
