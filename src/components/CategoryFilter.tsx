'use client';

import clsx from 'clsx';

interface CategoryFilterProps {
  categories: Array<{ value: string; label: string; count?: number }>;
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
          selected === null
            ? 'bg-white/10 text-white border-white/20'
            : 'bg-transparent text-white/40 border-white/[0.08] hover:text-white/60 hover:border-white/15'
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={clsx(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
            selected === cat.value
              ? 'bg-white/10 text-white border-white/20'
              : 'bg-transparent text-white/40 border-white/[0.08] hover:text-white/60 hover:border-white/15'
          )}
        >
          {cat.label}
          {cat.count != null && (
            <span className="ml-1.5 text-white/30">{cat.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
