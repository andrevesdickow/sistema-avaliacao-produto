import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const ratings = [1, 2, 3, 4, 5] as const;

type RatingStarsProps = {
  /** Nota inteira ou média (ex.: 4.33). */
  value: number;
  className?: string;
  label?: string;
};

/** Exibição acessível da nota (somente leitura). */
export function RatingStars({ value, className, label }: RatingStarsProps) {
  const rounded = Math.round(value);
  const formatted = value.toFixed(1).replace(".", ",");

  return (
    <span
      role="img"
      aria-label={label ?? `Nota ${formatted} de 5`}
      className={cn("inline-flex items-center gap-0.5 text-primary", className)}
    >
      {ratings.map((rating) => (
        <Star
          key={rating}
          aria-hidden
          className="size-4"
          fill={rating <= rounded ? "currentColor" : "none"}
          strokeWidth={rating <= rounded ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

type RatingInputProps = {
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
};

/**
 * Grupo de estrelas para o formulário. Usa radiolabels nativos para manter
 * navegação por teclado e leitura por leitores de tela sem JavaScript extra.
 */
export function RatingInput({
  name,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  disabled,
}: RatingInputProps) {
  return (
    <fieldset
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
    >
      <legend className="sr-only">Sua nota de 1 a 5 estrelas</legend>
      <div className="-ml-1 flex items-center gap-0.5">
        {ratings.map((rating) => {
          const selected = value === rating;

          return (
            <label
              key={rating}
              className="group relative inline-flex cursor-pointer items-center justify-center rounded-md p-1"
            >
              <input
                id={`${name}-${rating}`}
                type="radio"
                name={name}
                value={rating}
                checked={selected}
                onChange={() => onChange(rating)}
                onBlur={onBlur}
                className="peer sr-only"
                disabled={disabled}
              />
              <Star
                aria-hidden
                className={cn(
                  "size-7 transition-colors motion-reduce:transition-none",
                  rating <= value
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/45 group-hover:text-primary/70",
                )}
                fill={rating <= value ? "currentColor" : "none"}
                strokeWidth={rating <= value ? 0 : 1.5}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-md peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
              />
              <span className="sr-only">
                {rating} {rating === 1 ? "estrela" : "estrelas"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
