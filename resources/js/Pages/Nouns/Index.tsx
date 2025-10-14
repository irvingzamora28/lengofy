import React, { FormEvent, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiSearch, FiHeart, FiList } from 'react-icons/fi';
import AddNounToListModal from '@/Components/AddNounToListModal';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatorLink { url: string | null; label: string; active: boolean }
interface Paginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginatorLink[];
}

interface NounRow {
  id: number;
  word: string;
  translation?: string | null;
  gender?: string | null;
  is_favorite?: boolean;
}

interface Props {
  filters: { q?: string; per_page?: number };
  nouns: Paginator<NounRow> | { data: NounRow[]; meta: any };
}

export default function Index({ filters, nouns }: Props) {
  const searchInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState<string>(filters.q ?? '');
  const [selectedNounId, setSelectedNounId] = useState<number | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const normalized = (() => {
    const anyNouns: any = nouns;
    if ('meta' in anyNouns) {
      return {
        data: anyNouns.data as NounRow[],
        current_page: anyNouns.meta.current_page,
        last_page: anyNouns.meta.last_page,
        per_page: anyNouns.meta.per_page,
        total: anyNouns.meta.total,
        links: anyNouns.meta.links as PaginatorLink[]
      } as Paginator<NounRow>;
    }
    return nouns as Paginator<NounRow>;
  })();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.get(route('nouns.index'), { q }, { preserveState: true, replace: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl leading-tight dark:text-gray-100">Nouns</h2>}>
      <Head title="Nouns" />

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
                placeholder="Search nouns..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"><FiSearch className="w-7 h-7" /></button>
              <Link
                href={route('nouns.index')}
                className="px-3 py-3 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                preserveState
                replace
              >Clear</Link>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm dark:text-gray-100">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4">Word</th>
                    <th className="py-2 pr-4">Translation</th>
                    <th className="py-2 pr-4">Gender</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.data.map((n) => (
                    <tr key={n.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-100">
                      <td className="py-2 pr-4 font-medium">{n.word}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{n.translation ?? ''}</td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{n.gender ?? ''}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (n.is_favorite) {
                                router.delete(route('nouns.unfavorite', n.id), { preserveScroll: true });
                              } else {
                                router.post(route('nouns.favorite', n.id), {}, { preserveScroll: true });
                              }
                            }}
                            className={`p-2 rounded-md ${n.is_favorite ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                            aria-label={n.is_favorite ? 'Unfavorite' : 'Favorite'}
                          >
                            <FiHeart className="w-5 h-5" fill={n.is_favorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedNounId(n.id);
                              setIsListModalOpen(true);
                            }}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            aria-label="Add to list"
                          >
                            <FiList className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* My Nouns + Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Link href={route('my-nouns.index')} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">My Nouns</Link>
              <Link href={route('noun-lists.index')} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100">My Lists</Link>
            </div>
          </div>
          <Pagination>
            <PaginationContent>
              {(() => {
                const current = (normalized as any).current_page ?? 1;
                const last = (normalized as any).last_page ?? 1;
                const links = (normalized as any).links as PaginatorLink[] | undefined;
                const prev = links?.find((l) => (l.label || '').toLowerCase().includes('previous'));
                const next = links?.find((l) => (l.label || '').toLowerCase().includes('next'));
                const urlFor = (page: number) => links?.find((l) => l.label === String(page))?.url || '#';

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

                const items: (number | 'ellipsis')[] = [];
                if (current <= 3) {
                  items.push(1, 2, 3, 'ellipsis', last);
                } else if (current >= last - 2) {
                  items.push(1, 'ellipsis', last - 2, last - 1, last);
                } else {
                  items.push(1, 'ellipsis', current, 'ellipsis', last);
                }

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
                          <PaginationEllipsis className="dark:text-gray-100" />
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

      {selectedNounId && (
        <AddNounToListModal
          nounId={selectedNounId}
          isOpen={isListModalOpen}
          onClose={() => {
            setIsListModalOpen(false);
            setSelectedNounId(null);
          }}
        />
      )}
    </AuthenticatedLayout>
  );
}
