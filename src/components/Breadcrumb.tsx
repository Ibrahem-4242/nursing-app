import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-xs text-slate-500 py-3 mb-6 overflow-x-auto" dir="rtl" aria-label="مسار التصفح">
      <Link href="/" className="flex items-center gap-1 hover:text-teal-700 transition flex-shrink-0">
        <Home className="w-3.5 h-3.5" />
        <span>الرئيسية</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronLeft className="w-3.5 h-3.5 mx-2 text-slate-300 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="font-bold text-slate-800 flex-shrink-0 max-w-[200px] sm:max-w-xs truncate">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-teal-700 transition flex-shrink-0">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
