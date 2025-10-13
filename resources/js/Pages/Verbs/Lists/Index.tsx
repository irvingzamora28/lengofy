import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiPlus, FiList, FiTrash2, FiEdit } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface VerbListItem {
  id: number;
  name: string;
  description: string | null;
  items_count: number;
  created_at: string;
}

interface Props {
  auth: { user: any };
  lists: VerbListItem[];
}

export default function Index({ lists }: Props) {
  const { t: trans } = useTranslation();

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            {trans('My Verb Lists')}
          </h2>
          <Link href={route('verb-lists.create')}>
            <Button>
              <FiPlus className="mr-2" />
              {trans('Create New List')}
            </Button>
          </Link>
        </div>
      }
    >
      <Head title={trans('My Verb Lists')} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {lists.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FiList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {trans('No lists yet')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {trans('Create your first verb list to start organizing verbs for study.')}
                  </p>
                  <div className="mt-6">
                    <Link href={route('verb-lists.create')}>
                      <Button>
                        <FiPlus className="mr-2" />
                        {trans('Create New List')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <Card key={list.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Link
                        href={route('verb-lists.show', list.id)}
                        className="hover:text-blue-600 dark:hover:text-blue-400 flex-1"
                      >
                        {list.name}
                      </Link>
                      <div className="flex gap-2">
                        <Link href={route('verb-lists.edit', list.id)}>
                          <Button variant="ghost" size="sm">
                            <FiEdit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardTitle>
                    {list.description && (
                      <CardDescription>{list.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {list.items_count} {trans('verbs')}
                      </span>
                      <Link href={route('verb-lists.show', list.id)}>
                        <Button variant="outline" size="sm">
                          {trans('View')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link href={route('verbs.index')}>
              <Button variant="outline">
                {trans('Browse All Verbs')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
