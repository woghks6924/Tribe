export function formatKRW(amount: number) {
  return `₩${amount.toLocaleString("en-US")}`;
}
