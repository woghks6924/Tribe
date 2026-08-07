import { SpecGauge } from "@/components/product/spec-gauge";
import { TEMP_SCALE, EFFORT_SCALE } from "@/lib/product-specs";
import type { ProductDetailData } from "@/types";

export function TechSpecsSection({ product }: { product: ProductDetailData }) {
  const hasSpecs =
    !!product.fitType ||
    !!product.pocketing ||
    (product.tempMin != null && product.tempMax != null) ||
    (product.effortMin != null && product.effortMax != null) ||
    !!product.materials ||
    product.careInstructions.length > 0;
  const hasFunctionality = product.functionalities.length > 0;

  if (!hasSpecs && !hasFunctionality) return null;

  return (
    <div className="grid grid-cols-1 gap-12 border-t border-line pt-10 md:grid-cols-2 md:gap-16">
      {hasSpecs && (
        <div className="flex flex-col gap-6">
          <h3 className="font-sans text-xl font-extrabold tracking-[0.02em] uppercase">
            Tech Specs
          </h3>
          <div className="flex flex-col gap-5 text-sm">
            {product.fitType && (
              <div className="flex justify-between border-b border-line pb-4">
                <span className="font-semibold">Fit</span>
                <span className="text-ink-muted">{product.fitType}</span>
              </div>
            )}
            {product.pocketing && (
              <div className="flex justify-between border-b border-line pb-4">
                <span className="font-semibold">Pocketing</span>
                <span className="text-ink-muted">{product.pocketing}</span>
              </div>
            )}
            {product.tempMin != null && product.tempMax != null && (
              <div className="flex flex-col gap-3 border-b border-line pb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Temperature</span>
                  <span className="text-xs text-ink-muted">
                    Designed for {product.tempMin}°C to {product.tempMax}°C temperatures.
                  </span>
                </div>
                <SpecGauge
                  min={product.tempMin}
                  max={product.tempMax}
                  scaleMin={TEMP_SCALE.min}
                  scaleMax={TEMP_SCALE.max}
                  labels={TEMP_SCALE.labels}
                  unit="°C"
                />
              </div>
            )}
            {product.effortMin != null && product.effortMax != null && (
              <div className="flex flex-col gap-3 border-b border-line pb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Effort</span>
                  <span className="text-xs text-ink-muted">
                    This product was designed for {product.effortMin}–{product.effortMax}% effort.
                  </span>
                </div>
                <SpecGauge
                  min={product.effortMin}
                  max={product.effortMax}
                  scaleMin={EFFORT_SCALE.min}
                  scaleMax={EFFORT_SCALE.max}
                  labels={EFFORT_SCALE.labels}
                  unit="%"
                />
              </div>
            )}
            {(product.materials || product.careInstructions.length > 0) && (
              <div className="grid grid-cols-2 gap-6">
                {product.materials && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold">Materials</span>
                    <span className="text-ink-muted">{product.materials}</span>
                  </div>
                )}
                {product.careInstructions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold">Care</span>
                    <div className="flex flex-col gap-1.5 text-ink-muted">
                      {product.careInstructions.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(product.careNote || product.madeIn) && (
              <div className="flex flex-col gap-1 text-xs text-ink-faint">
                {product.careNote && <p>{product.careNote}</p>}
                {product.madeIn && <p>Garment made in {product.madeIn}.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {hasFunctionality && (
        <div className="flex flex-col gap-6">
          <h3 className="font-sans text-xl font-extrabold tracking-[0.02em] uppercase">
            Functionality
          </h3>
          <div className="flex flex-col gap-6">
            {product.functionalities.map((f) => (
              <div key={f.id} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-base-elevated">
                  {f.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.icon} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-ink-faint">{f.title.charAt(0)}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold tracking-[0.02em] uppercase">
                    {f.title}
                  </span>
                  <p className="text-sm text-ink-muted">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
