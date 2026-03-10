import type { ReactNode } from "react";

export function StatusCard({
  title,
  value,
  detail,
  children,
}: {
  title: string;
  value: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <section className="card">
      <p className="card-label">{title}</p>
      <p className="card-value">{value}</p>
      <p className="card-detail">{detail}</p>
      {children}
    </section>
  );
}
