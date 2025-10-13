import React, { FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface VerbListData {
  id: number;
  name: string;
  description: string | null;
}

interface Props {
  auth: { user: any };
  list: VerbListData;
}

export default function Edit({ list }: Props) {
  const { t: trans } = useTranslation();
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || '');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    router.patch(
      route('verb-lists.update', list.id),
      { name, description },
      {
        onError: (err) => {
          setErrors(err as any);
          setProcessing(false);
        },
        onSuccess: () => {
          setProcessing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm(trans('Are you sure you want to delete this list? This action cannot be undone.'))) {
      router.delete(route('verb-lists.destroy', list.id));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          {trans('Edit Verb List')}
        </h2>
      }
    >
      <Head title={trans('Edit Verb List')} />

      <div className="py-12">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{trans('Edit List')}</CardTitle>
              <CardDescription>
                {trans('Update the name and description of your verb list.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">{trans('List Name')} *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                    required
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">{trans('Description')} ({trans('optional')})</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                    rows={4}
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                      {processing ? trans('Saving...') : trans('Save Changes')}
                    </Button>
                    <Link href={route('verb-lists.show', list.id)}>
                      <Button type="button" variant="outline">
                        {trans('Cancel')}
                      </Button>
                    </Link>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    {trans('Delete List')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
