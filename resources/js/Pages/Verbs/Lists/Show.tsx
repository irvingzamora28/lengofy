import React, { FormEvent, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiSearch, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface VerbRow {
  id: number;
  infinitive: string;
  translation?: string | null;
  notes?: string | null;
  order_index: number;
}

interface PaginatorLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Paginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginatorLink[];
}

interface VerbListData {
  id: number;
  name: string;
  description: string | null;
  items_count: number;
}

interface Props {
  auth: { user: any };
  list: VerbListData;
  filters: { q?: string; per_page?: number };
  verbs: Paginator<VerbRow>;
}

export default function Show({ list, filters, verbs }: Props) {
  const { t: trans } = useTranslation();
  const searchInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState<string>(filters.q ?? '');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    router.get(
      route('verb-lists.show', list.id),
      { q, per_page: filters.per_page },
      { preserveState: true }
    );
  };

  const handleRemoveVerb = (verbId: number) => {
    if (confirm(trans('Remove this verb from the list?'))) {
      router.delete(route('verb-lists.remove-verb', [list.id, verbId]), {
        preserveScroll: true,
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
              {list.name}
            </h2>
            {list.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {list.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={route('verb-lists.edit', list.id)}>
              <Button variant="outline">
                <FiEdit className="mr-2" />
                {trans('Edit')}
              </Button>
            </Link>
            <Link href={route('verb-lists.index')}>
              <Button variant="outline">{trans('Back to Lists')}</Button>
            </Link>
          </div>
        </div>
      }
    >
      <Head title={list.name} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {trans('Verbs in this list')} ({list.items_count})
                  </CardTitle>
                  <CardDescription>
                    {trans('Click on a verb to view its conjugations')}
                  </CardDescription>
                </div>
                <Link href={route('verbs.index')}>
                  <Button>
                    <FiPlus className="mr-2" />
                    {trans('Add Verbs')}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <Input
                      ref={searchInput}
                      type="text"
                      placeholder={trans('Search verbs...')}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">{trans('Search')}</Button>
                  {q && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setQ('');
                        router.get(
                          route('verb-lists.show', list.id),
                          { per_page: filters.per_page },
                          { preserveState: true }
                        );
                      }}
                    >
                      {trans('Clear')}
                    </Button>
                  )}
                </div>
              </form>

              {verbs.data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {q
                      ? trans('No verbs found matching your search.')
                      : trans('This list is empty. Add some verbs to get started!')}
                  </p>
                  {!q && (
                    <div className="mt-4">
                      <Link href={route('verbs.index')}>
                        <Button>
                          <FiPlus className="mr-2" />
                          {trans('Browse Verbs')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{trans('Infinitive')}</TableHead>
                        <TableHead>{trans('Translation')}</TableHead>
                        <TableHead>{trans('Notes')}</TableHead>
                        <TableHead className="text-right">{trans('Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verbs.data.map((verb) => (
                        <TableRow key={verb.id}>
                          <TableCell>
                            <Link
                              href={route('verbs.show', verb.id)}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {verb.infinitive}
                            </Link>
                          </TableCell>
                          <TableCell>{verb.translation || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {verb.notes || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVerb(verb.id)}
                            >
                              <FiTrash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {verbs.last_page > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          {verbs.links.map((link, idx) => {
                            if (idx === 0) {
                              return (
                                <PaginationItem key={idx}>
                                  <PaginationPrevious
                                    href={link.url || '#'}
                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                  />
                                </PaginationItem>
                              );
                            }
                            if (idx === verbs.links.length - 1) {
                              return (
                                <PaginationItem key={idx}>
                                  <PaginationNext
                                    href={link.url || '#'}
                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                  />
                                </PaginationItem>
                              );
                            }
                            return (
                              <PaginationItem key={idx}>
                                <PaginationLink
                                  href={link.url || '#'}
                                  isActive={link.active}
                                >
                                  {link.label}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
