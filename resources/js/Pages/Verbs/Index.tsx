import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl leading-tight">Verbs</h2>}>
      <Head title="Verbs" />

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
                placeholder="Search infinitive or translation..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Search</button>
              <Link
                href={route('verbs.index')}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                preserveState
                replace
              >Clear</Link>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4">Infinitive</th>
                    <th className="py-2 pr-4">Translation</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.data.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4 font-medium">{v.infinitive}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{v.translation ?? ''}</td>
                      <td className="py-2 text-right">
                        <Link href={route('verbs.show', v.infinitive)} className="text-indigo-600 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap gap-2 items-center">
            {normalized.links?.map((l, i) => {
              const raw = l.label?.toLowerCase?.() || '';
              const isPrev = raw.includes('previous');
              const isNext = raw.includes('next');
              return (
                <Link
                  key={i}
                  href={l.url || ''}
                  className={`px-3 py-1 rounded border ${l.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  preserveScroll
                  preserveState
                >
                  {/* Mobile: icons for prev/next, text for others */}
                  <span className="md:hidden">
                    {isPrev ? (
                      <FiChevronLeft />
                    ) : isNext ? (
                      <FiChevronRight />
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: l.label }} />
                    )}
                  </span>
                  {/* Desktop: always show text labels */}
                  <span className="hidden md:inline" dangerouslySetInnerHTML={{ __html: l.label }} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
