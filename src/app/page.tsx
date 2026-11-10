import { HomeHero } from "@/components/home/home-hero";
import { SiteShell } from "@/components/layout/site-shell";
import { ProductGrid } from "@/components/products/product-grid";

export default function HomePage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <HomeHero />

        <section aria-label="Produtos" className="mt-12 sm:mt-16">
          <ProductGrid />
        </section>
      </div>
    </SiteShell>
  );
}
