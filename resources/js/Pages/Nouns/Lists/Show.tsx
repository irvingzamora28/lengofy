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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface NounRow {
  id: number;
  word: string;
  translation?: string | null;
  gender?: string | null;
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

interface NounListData {
  id: number;
  name: string;
  description: string | null;
  items_count: number;
}

interface Props {
  auth: { user: any };
  list: NounListData;
  filters: { q?: string; per_page?: number };
  nouns: Paginator<NounRow>;
}

export default function Show({ list, filters, nouns }: Props) {
  const { t: trans } = useTranslation();
  const searchInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState<string>(filters.q ?? '');
  const [nounToRemove, setNounToRemove] = useState<number | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    router.get(
      route('noun-lists.show', list.id),
      { q, per_page: filters.per_page },
      { preserveState: true }
    );
  };

  const handleRemoveNoun = () => {
    if (nounToRemove) {
      router.delete(route('noun-lists.remove-noun', [list.id, nounToRemove]), {
        preserveScroll: true,
        onFinish: () => setNounToRemove(null),
      });
    }
  };

  const getGenderBadge = (gender: string | null | undefined) => {
    if (!gender) return null;
    
    const colors: Record<string, string> = {
      masculine: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      feminine: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      neuter: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[gender] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {gender}
      </span>
    );
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
            <Link href={route('noun-lists.edit', list.id)}>
              <Button variant="outline">
                <FiEdit className="mr-2" />
                {trans('Edit')}
              </Button>
            </Link>
            <Link href={route('noun-lists.index')}>
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
                    {trans('Nouns in this list')} ({list.items_count})
                  </CardTitle>
                  <CardDescription>
                    {trans('Manage your custom noun collection')}
                  </CardDescription>
                </div>
                <Link href={route('nouns.index')}>
                  <Button>
                    <FiPlus className="mr-2" />
                    {trans('Add Nouns')}
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
                      placeholder={trans('Search nouns...')}
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
                          route('noun-lists.show', list.id),
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

              {nouns.data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {q
                      ? trans('No nouns found matching your search.')
                      : trans('This list is empty. Add some nouns to get started!')}
                  </p>
                  {!q && (
                    <div className="mt-4">
                      <Link href={route('nouns.index')}>
                        <Button>
                          <FiPlus className="mr-2" />
                          {trans('Browse Nouns')}
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
                        <TableHead>{trans('Word')}</TableHead>
                        <TableHead>{trans('Translation')}</TableHead>
                        <TableHead>{trans('Gender')}</TableHead>
                        <TableHead>{trans('Notes')}</TableHead>
                        <TableHead className="text-right">{trans('Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nouns.data.map((noun) => (
                        <TableRow key={noun.id}>
                          <TableCell className="font-medium">
                            {noun.word}
                          </TableCell>
                          <TableCell>{noun.translation || '-'}</TableCell>
                          <TableCell>{getGenderBadge(noun.gender)}</TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {noun.notes || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setNounToRemove(noun.id)}
                            >
                              <FiTrash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {nouns.last_page > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          {nouns.links.map((link, idx) => {
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
                            if (idx === nouns.links.length - 1) {
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

      <AlertDialog open={nounToRemove !== null} onOpenChange={(open) => !open && setNounToRemove(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              {trans('Remove noun from list?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {trans('This will remove the noun from this list. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              {trans('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveNoun}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              {trans('Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}
