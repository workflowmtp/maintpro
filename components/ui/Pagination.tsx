'use client';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ totalItems, currentPage, perPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  const startP = Math.max(1, currentPage - 2);
  const endP = Math.min(totalPages, currentPage + 2);

  const pages: (number | '...')[] = [];
  if (startP > 1) {
    pages.push(1);
    if (startP > 2) pages.push('...');
  }
  for (let p = startP; p <= endP; p++) {
    pages.push(p);
  }
  if (endP < totalPages) {
    if (endP < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="pagi-bar">
      <div className="pagi-info">{start}-{end} sur {totalItems}</div>
      <div className="pagi-btns">
        <button
          className="pagi-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &#9664;
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={'dots-' + i} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>
          ) : (
            <button
              key={p}
              className={'pagi-btn' + (p === currentPage ? ' active' : '')}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="pagi-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &#9654;
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
