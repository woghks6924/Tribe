export function generateOrderNumber() {
  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRB${stamp}${random}`;
}
