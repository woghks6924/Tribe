"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

const HIDDEN_ON = ["/login", "/signup"];

export function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;
  return <Footer />;
}
