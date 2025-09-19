import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiChevronLeft, FiChevronRight, FiHeart, FiSearch } from 'react-icons/fi';

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
  is_favorite: boolean;
  priority?: number | null;
  notes?: string | null;
}

interface Props {
  filters: { q?: string; sort?: string; per_page?: number };
  verbs: Paginator<VerbRow> | { data: VerbRow[]; meta: any };
}

export default function MyVerbs({ filters, verbs }: Props) {
  const [q, setQ] = useState<string>(filters.q ?? '');
  const [sort, setSort] = useState<string>(filters.sort ?? 'recent');

  const normalized = useMemo(() => {
    const anyVerbs: any = verbs;
    if ('meta' in anyVerbs) {
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
  }, [verbs]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('my-verbs.index'), { q, sort }, { preserveState: true, replace: true });
  };

  const toggleFavorite = (verb: VerbRow) => {
    if (verb.is_favorite) {
      router.delete(route('verbs.unfavorite', verb.id), { preserveScroll: true });
    } else {
      router.post(route('verbs.favorite', verb.id), {}, { preserveScroll: true });
    }
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl leading-tight dark:text-gray-100">My Verbs</h2>}>
      <Head title="My Verbs" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
              <form onSubmit={submitSearch} className="flex-1 flex gap-2 items-center">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search saved verbs..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  <FiSearch className="w-5 h-5" />
                </button>
              </form>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); router.get(route('my-verbs.index'), { q, sort: e.target.value }, { preserveState: true, replace: true }); }}
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="recent">Most recent</option>
                  <option value="priority">Priority</option>
                  <option value="alpha">Alphabetical</option>
                </select>
                <Link href={route('verbs.index')} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">Browse all verbs</Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm dark:text-gray-100">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4">Infinitive</th>
                    <th className="py-2 pr-4">Translation</th>
                    <th className="py-2 pr-4">Priority</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.data.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 pr-4 font-medium">{v.infinitive}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{v.translation ?? ''}</td>
                      <td className="py-2 pr-4">
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={v.priority ?? ''}
                          onChange={(e) => {
                            const priority = e.target.value ? Number(e.target.value) : null;
                            router.patch(route('my-verbs.update', v.id), { priority }, { preserveScroll: true });
                          }}
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleFavorite(v)}
                            className={`p-2 rounded-md ${v.is_favorite ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                            aria-label={v.is_favorite ? 'Unfavorite' : 'Favorite'}
                          >
                            <FiHeart className="w-5 h-5" fill={v.is_favorite ? 'currentColor' : 'none'} />
                          </button>
                          <Link href={route('verbs.show', v.id)} className="text-indigo-600 dark:text-indigo-300 hover:underline">Study</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple pagination controls using provided links if available */}
          {(() => {
            const links = (normalized as any).links as PaginatorLink[] | undefined;
            if (!links) return null;
            const prev = links.find((l) => (l.label || '').toLowerCase().includes('previous'));
            const next = links.find((l) => (l.label || '').toLowerCase().includes('next'));
            return (
              <div className="flex items-center justify-center gap-4">
                <Link href={prev?.url || '#'} className="flex items-center gap-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
                  <FiChevronLeft /> Prev
                </Link>
                <span className="text-sm dark:text-gray-300">Page {(normalized as any).current_page} of {(normalized as any).last_page}</span>
                <Link href={next?.url || '#'} className="flex items-center gap-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">
                  Next <FiChevronRight />
                </Link>
              </div>
            );
          })()}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
