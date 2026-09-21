import type { CommentAttachment } from "@/types";

// Files are stored as base64 data URLs inside the comment row, so keep them
// small. Base64 inflates size by ~1/3, which also keeps a full request under
// typical serverless body limits (~4.5MB).
export const MAX_ATTACHMENTS_PER_COMMENT = 5;
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const MAX_ATTACHMENT_TOTAL_BYTES = 3 * 1024 * 1024;

// Only these are ever served inline (rendered in the page). Everything else
// — notably SVG and HTML, which can run script — is forced to download.
export const INLINE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns an error message, or null when the list is acceptable.
export function validateAttachments(
  list: Pick<CommentAttachment, "name" | "size">[]
): string | null {
  if (list.length > MAX_ATTACHMENTS_PER_COMMENT) {
    return `You can attach up to ${MAX_ATTACHMENTS_PER_COMMENT} files per update.`;
  }
  const tooBig = list.find((f) => f.size > MAX_ATTACHMENT_BYTES);
  if (tooBig) {
    return `"${tooBig.name}" is larger than ${formatBytes(MAX_ATTACHMENT_BYTES)}.`;
  }
  const total = list.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_ATTACHMENT_TOTAL_BYTES) {
    return `Attachments can total at most ${formatBytes(MAX_ATTACHMENT_TOTAL_BYTES)} per update.`;
  }
  return null;
}
