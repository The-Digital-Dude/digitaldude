import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface PseoBreadcrumbsProps {
  items: Array<{ label: string; url: string }>;
}

export function PseoBreadcrumbs({ items }: PseoBreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-1 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
            {index === 0 ? (
              <Link
                href={item.url}
                className="flex items-center gap-1 hover:text-navy transition"
              >
                <Home className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            ) : isLast ? (
              <span className="font-semibold text-navy truncate max-w-[200px] md:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.url}
                className="hover:text-navy transition truncate max-w-[150px] md:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
