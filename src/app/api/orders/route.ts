import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/order-number";
import { calcShippingFee } from "@/lib/shipping";
import { MIN_NAVERPAY_AMOUNT } from "@/lib/portone";
import { validatePromoCode } from "@/lib/promo";
import { getCurrentCustomer } from "@/lib/auth/session";

type CreateOrderBody = {
  customer: { name: string; email: string; phone: string };
  shipping: {
    zipCode: string;
    address1: string;
    address2?: string;
    memo?: string;
  };
  items: { productOptionId: string; quantity: number }[];
  pgProvider: "TOSSPAYMENTS" | "NAVERPAY";
  promoCode?: string;
};

const CHANNEL_KEYS: Record<CreateOrderBody["pgProvider"], string | undefined> = {
  TOSSPAYMENTS: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSS,
  NAVERPAY: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY,
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateOrderBody;

  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }
  if (!body.customer?.name || !body.customer?.email || !body.customer?.phone) {
    return NextResponse.json({ error: "Please fill in your contact information." }, { status: 400 });
  }
  if (!body.shipping?.zipCode || !body.shipping?.address1) {
    return NextResponse.json({ error: "Please fill in your shipping address." }, { status: 400 });
  }

  const channelKey = CHANNEL_KEYS[body.pgProvider];
  if (!channelKey) {
    return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
  }

  const optionIds = body.items.map((i) => i.productOptionId);
  const options = await prisma.productOption.findMany({
    where: { id: { in: optionIds } },
    include: { product: true },
  });

  if (options.length !== optionIds.length) {
    return NextResponse.json({ error: "One or more product options do not exist." }, { status: 400 });
  }

  const lineItems: {
    productId: string;
    productOptionId: string;
    productName: string;
    optionLabel: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[] = [];

  for (const requested of body.items) {
    const option = options.find((o) => o.id === requested.productOptionId)!;
    if (requested.quantity < 1 || requested.quantity > option.stock) {
      return NextResponse.json(
        { error: `Not enough stock: ${option.product.name} (${option.size}/${option.color})` },
        { status: 400 },
      );
    }
    const unitPrice = option.product.price + option.priceDiff;
    lineItems.push({
      productId: option.productId,
      productOptionId: option.id,
      productName: option.product.name,
      optionLabel: `${option.size} / ${option.color}`,
      unitPrice,
      quantity: requested.quantity,
      lineTotal: unitPrice * requested.quantity,
    });
  }

  const subtotal = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const shippingFee = calcShippingFee(subtotal);

  let discount = 0;
  let appliedPromoId: string | null = null;
  let appliedPromoCode: string | null = null;

  if (body.promoCode) {
    const result = await validatePromoCode(body.promoCode, subtotal);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    discount = result.discountAmount;
    appliedPromoId = result.promoCodeId;
    appliedPromoCode = body.promoCode.trim().toUpperCase();
  }

  const totalAmount = Math.max(subtotal + shippingFee - discount, 0);

  if (body.pgProvider === "NAVERPAY" && totalAmount < MIN_NAVERPAY_AMOUNT) {
    return NextResponse.json(
      { error: `Naver Pay requires a minimum payment of ₩${MIN_NAVERPAY_AMOUNT}.` },
      { status: 400 },
    );
  }

  const orderNumber = generateOrderNumber();
  const session = await getCurrentCustomer();

  await prisma.$transaction([
    prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING_PAYMENT",
        customerId: session?.sub,
        customerName: body.customer.name,
        customerEmail: body.customer.email,
        customerPhone: body.customer.phone,
        zipCode: body.shipping.zipCode,
        address1: body.shipping.address1,
        address2: body.shipping.address2,
        shippingMemo: body.shipping.memo,
        subtotal,
        shippingFee,
        discount,
        promoCode: appliedPromoCode,
        totalAmount,
        items: { create: lineItems },
        payment: {
          create: {
            pgProvider: body.pgProvider,
            channelKey,
            status: "READY",
            paymentId: orderNumber,
            requestedAmount: totalAmount,
          },
        },
      },
    }),
    ...(appliedPromoId
      ? [prisma.promoCode.update({ where: { id: appliedPromoId }, data: { usedCount: { increment: 1 } } })]
      : []),
  ]);

  return NextResponse.json({ orderNumber, totalAmount });
}
