import { prisma } from "@/lib/prisma";

export type PromoValidation =
  | { valid: true; discountAmount: number; promoCodeId: string }
  | { valid: false; error: string };

export async function validatePromoCode(
  code: string,
  subtotal: number,
): Promise<PromoValidation> {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!promo || !promo.active) {
    return { valid: false, error: "Invalid promo code." };
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { valid: false, error: "This promo code has expired." };
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { valid: false, error: "This promo code has reached its usage limit." };
  }
  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
    return {
      valid: false,
      error: `This code requires a minimum order of ₩${promo.minOrderAmount.toLocaleString("en-US")}.`,
    };
  }

  const discountAmount =
    promo.discountType === "PERCENTAGE"
      ? Math.floor((subtotal * promo.discountValue) / 100)
      : Math.min(promo.discountValue, subtotal);

  return { valid: true, discountAmount, promoCodeId: promo.id };
}
