export const SHIPPING_FEE = 3000;
export const FREE_SHIPPING_THRESHOLD = 50000;

export function calcShippingFee(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
