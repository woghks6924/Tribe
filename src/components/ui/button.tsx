import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-base hover:bg-ink/85",
  outline: "border border-ink text-ink hover:bg-ink hover:text-base",
  ghost: "text-ink-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
