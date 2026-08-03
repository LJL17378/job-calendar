import type { ReactNode } from "react";

export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {meta && <p>{meta}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
