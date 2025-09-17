import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
// shadcn/ui pagination
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';

// Basic paginator types (compatible with Laravel's paginator JSON)
interface PaginatorLink { url: string | null; label: string; active: boolean }
interface Paginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginatorLink[];
}

interface VerbRow {
  id: number;
  infinitive: string;
  translation?: string | null;
  is_irregular: boolean;
  frequency_rank?: number | null;
}

interface Props {
  auth: { user: any };
  filters: { q?: string; per_page?: number };
  // When using Laravel paginator directly via Inertia, the object is nested under 'verbs'
  verbs: Paginator<VerbRow> | { data: VerbRow[]; meta: any };
}

export default function Index({ filters, verbs }: Props) {
  const { t: trans } = useTranslation();
  const searchInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState<string>(filters.q ?? '');

  // Normalize paginator shape (support both meta/data and flattened)
  const normalized = (() => {
    const anyVerbs: any = verbs;
    if ('meta' in anyVerbs) {
      // shape from custom serialization
      return {
        data: anyVerbs.data as VerbRow[],
        current_page: anyVerbs.meta.current_page,
        last_page: anyVerbs.meta.last_page,
        per_page: anyVerbs.meta.per_page,
        total: anyVerbs.meta.total,
        links: anyVerbs.meta.links as PaginatorLink[]
      } as Paginator<VerbRow>;
    }
    return verbs as Paginator<VerbRow>;
  })();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.get(route('verbs.index'), { q }, { preserveState: true, replace: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl leading-tight dark:text-gray-100">{trans('generals.verbs.title')}</h2>}>
      <Head title={trans('generals.verbs.title')} />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
          {/* Search */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <form onSubmit={submit} className="p-4 flex gap-2 items-center">
              <input
                ref={searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder={trans('generals.verbs.search_placeholder')}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"><FiSearch className="w-7 h-7" /></button>
              <Link
                href={route('verbs.index')}
                className="px-3 py-3 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                preserveState
                replace
              >{trans('generals.verbs.clear')}</Link>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm dark:text-gray-100">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4">{trans('generals.verbs.infinitive')}</th>
                    <th className="py-2 pr-4">{trans('generals.verbs.translation')}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.data.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-100">
                      <td className="py-2 pr-4 font-medium">{v.infinitive}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{v.translation ?? ''}</td>
                      <td className="py-2 text-right">
                        <Link href={route('verbs.show', v.infinitive)} className="text-indigo-600 dark:text-indigo-300 hover:underline">{trans('generals.verbs.view')}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination (shadcn/ui) - compact with ellipses */}
          <Pagination>
            <PaginationContent>
              {(() => {
                const current = (normalized as any).current_page ?? 1;
                const last = (normalized as any).last_page ?? 1;
                const links = (normalized as any).links as PaginatorLink[] | undefined;
                const prev = links?.find((l) => (l.label || '').toLowerCase().includes('previous'));
                const next = links?.find((l) => (l.label || '').toLowerCase().includes('next'));
                const urlFor = (page: number) => links?.find((l) => l.label === String(page))?.url || '#';

                // Small sets: show all pages 1..last
                if (last <= 5) {
                  return (
                    <>
                      <PaginationItem>
                        <PaginationPrevious href={prev?.url || '#'} className="dark:text-gray-100" />
                      </PaginationItem>
                      {Array.from({ length: last }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={`p-${p}`}>
                          <PaginationLink href={urlFor(p)} isActive={p === current} className="dark:text-gray-100">
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext href={next?.url || '#'} className="dark:text-gray-100" />
                      </PaginationItem>
                    </>
                  );
                }

                // Large sets UX:
                // - At most 4 page buttons shown (excluding Prev/Next):
                //   Start cluster: 1, 2, 3, ..., last
                //   Middle cluster: 1, ..., current, ..., last
                //   End cluster: 1, ..., last-2, last-1, last
                const items: (number | 'ellipsis')[] = [];
                if (current <= 3) {
                  items.push(1, 2, 3, 'ellipsis', last);
                } else if (current >= last - 2) {
                  items.push(1, 'ellipsis', last - 2, last - 1, last);
                } else {
                  items.push(1, 'ellipsis', current, 'ellipsis', last);
                }

                // De-duplicate and clamp to valid range
                const seen = new Set<string>();
                const compact = items.filter((v) => {
                  if (v === 'ellipsis') return true;
                  if (v < 1 || v > last) return false;
                  const key = String(v);
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });

                return (
                  <>
                    <PaginationItem>
                      <PaginationPrevious href={prev?.url || '#'} className="dark:text-gray-100" />
                    </PaginationItem>
                    {compact.map((v, idx) =>
                      v === 'ellipsis' ? (
                        <PaginationItem key={`e-${idx}`}>
                          <PaginationEllipsis className="dark:text-gray-100"/>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={`p-${v}`}>
                          <PaginationLink href={urlFor(v)} isActive={v === current} className="dark:text-gray-100">
                            {v}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext href={next?.url || '#'} className="dark:text-gray-100" />
                    </PaginationItem>
                  </>
                );
              })()}
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
