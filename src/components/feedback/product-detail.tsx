import { notFound } from "next/navigation";

import { FeedbackAuthRequired } from "@/components/feedback/feedback-auth-required";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { ProductAiSummary } from "@/components/feedback/product-ai-summary";
import { ProductHero } from "@/components/feedback/product-hero";
import { getCurrentUser } from "@/server/auth/session";
import { listFeedbacks } from "@/server/feedback/list-feedbacks";
import { getProduct } from "@/server/products/get-product";

export async function ProductDetail({ id }: { id: string }) {
  const [product, feedbacks, user] = await Promise.all([
    getProduct(id),
    listFeedbacks(id),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  const averageScore =
    feedbacks.length > 0
      ? feedbacks.reduce((total, feedback) => total + feedback.score, 0) /
        feedbacks.length
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <ProductHero
        product={product}
        averageScore={averageScore}
        feedbackCount={feedbacks.length}
      />

      {feedbacks.length > 0 ? (
        <div className="mt-10">
          <ProductAiSummary
            productId={product.id}
            feedbackCount={feedbacks.length}
          />
        </div>
      ) : null}

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-14">
        <FeedbackList feedbacks={feedbacks} />

        <aside className="lg:sticky lg:top-24">
          {user ? <FeedbackForm productId={id} /> : <FeedbackAuthRequired />}
        </aside>
      </div>
    </div>
  );
}
