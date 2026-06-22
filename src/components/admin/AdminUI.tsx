import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Loader2 } from "lucide-react";

type Tone = "default" | "brand" | "success" | "warning" | "danger" | "muted";

const tones: Record<Tone, { color: string; bg: string; border: string }> = {
  default: { color: "#f4f4f5", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
  brand: { color: "#818cf8", bg: "rgba(99,102,241,0.11)", border: "rgba(99,102,241,0.26)" },
  success: { color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.22)" },
  warning: { color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.24)" },
  danger: { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.24)" },
  muted: { color: "#71717a", bg: "rgba(113,113,122,0.10)", border: "rgba(113,113,122,0.20)" },
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className="admin-title">{title}</h1>
        {description && <p className="admin-description">{description}</p>}
      </div>
      {actions && <div className="admin-header-actions">{actions}</div>}
    </header>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  tone = "default",
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <section className={`admin-panel ${className}`} style={{ "--panel-accent": t.color } as React.CSSProperties}>
      {(title || description || actions) && (
        <div className="admin-panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="admin-panel-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  large = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ElementType;
  tone?: Tone;
  large?: boolean;
}) {
  const t = tones[tone];
  return (
    <div className={`admin-metric ${large ? "is-large" : ""}`} style={{ "--metric-color": t.color, "--metric-bg": t.bg, "--metric-border": t.border } as React.CSSProperties}>
      <div className="admin-metric-top">
        <span>{label}</span>
        {Icon && (
          <div className="admin-metric-icon">
            <Icon size={15} />
          </div>
        )}
      </div>
      <div className="admin-metric-value">{value}</div>
      {sub && <div className="admin-metric-sub">{sub}</div>}
    </div>
  );
}

export function AdminStatusBadge({
  children,
  tone = "default",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const t = tones[tone];
  return (
    <span className="admin-status-badge" style={{ color: t.color, background: t.bg, borderColor: t.border }}>
      {dot && <span style={{ background: t.color }} />}
      {children}
    </span>
  );
}

export function AdminActionButton({
  href,
  onClick,
  children,
  tone = "brand",
  disabled = false,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  tone?: Tone;
  disabled?: boolean;
}) {
  const t = tones[tone];
  const className = "admin-action-button";
  const style = { color: t.color, background: t.bg, borderColor: t.border };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} style={style} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
  tone = "muted",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: Tone;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" || tone === "danger" ? AlertTriangle : Info;
  const t = tones[tone];
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon" style={{ color: t.color, background: t.bg, borderColor: t.border }}>
        <Icon size={20} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function AdminSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="admin-skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="admin-skeleton-row">
          <Loader2 size={14} className="spin" />
          <span />
        </div>
      ))}
    </div>
  );
}

export function AdminTable({
  columns,
  rows,
  empty,
}: {
  columns: ReactNode[];
  rows: ReactNode[];
  empty?: ReactNode;
}) {
  return (
    <div className="admin-table-wrap">
      <div className="admin-table-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column, index) => (
          <span key={index}>{column}</span>
        ))}
      </div>
      {rows.length > 0 ? rows : <div className="admin-table-empty">{empty}</div>}
    </div>
  );
}

export function AdminRowLink({
  href,
  children,
  columns,
}: {
  href: string;
  children: ReactNode;
  columns: string;
}) {
  return (
    <Link href={href} className="admin-row-link" style={{ gridTemplateColumns: columns }}>
      {children}
      <ArrowRight size={13} />
    </Link>
  );
}
