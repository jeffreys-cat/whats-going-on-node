"use client";

import type { Route } from "next";
import { startTransition, useDeferredValue, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CycleOption = {
  value: string;
  label: string;
};

export function GithubCycleSelector({
  options,
  selectedValue,
}: {
  options: CycleOption[];
  selectedValue: string;
}) {
  if (!options.length) {
    return null;
  }

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(selectedValue);
  const deferredValue = useDeferredValue(value);

  return (
    <label className="field filter-field">
      <span className="field-caption">Cycle</span>
      <select
        className="field-input"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;

          startTransition(() => {
            setValue(nextValue);

            const nextParams = new URLSearchParams(searchParams.toString());
            if (nextValue) {
              nextParams.set("cycle", nextValue);
            } else {
              nextParams.delete("cycle");
            }

            const query = nextParams.toString();
            const href = (query ? `${pathname}?${query}` : pathname) as Route;
            router.replace(href, { scroll: false });
          });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="card-detail">Showing cycle {deferredValue.replace("..", " to ")}.</span>
    </label>
  );
}
