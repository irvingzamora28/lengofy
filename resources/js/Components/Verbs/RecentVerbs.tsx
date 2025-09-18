import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { FiList, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface VerbRow {
  id: number;
  infinitive: string;
  translation?: string | null;
}

export default function RecentVerbs() {
  const { t: trans } = useTranslation();
  const [verbs, setVerbs] = useState<VerbRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    axios
      .get(route('verbs.random'))
      .then((res) => {
        if (!mounted) return;
        setVerbs(res.data?.data ?? []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Error');
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 shadow-sm sm:rounded-lg p-2 sm:p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FiList className="w-5 h-5" />
          {trans('generals.verbs.title')}
        </h3>
        <Link
          href={route('verbs.index')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
        >
          {trans('generals.view_all') || 'View All'}
          <FiChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm dark:text-gray-100">
          <thead>
            <tr className="text-left border-b border-gray-100 dark:border-gray-800">
              <th className="py-2 pr-4">{trans('generals.verbs.infinitive')}</th>
              <th className="py-2 pr-4">{trans('generals.verbs.translation')}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {verbs === null && (
              <tr>
                <td className="py-3 pr-4" colSpan={3}>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="py-3 pr-4 text-red-600 dark:text-red-400" colSpan={3}>
                  {error}
                </td>
              </tr>
            )}
            {Array.isArray(verbs) && verbs.length > 0 &&
              verbs.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-100">
                  <td className="py-2 pr-4 font-medium">{v.infinitive}</td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{v.translation ?? ''}</td>
                  <td className="py-2 text-right">
                    <Link href={route('verbs.show', v.infinitive)} className="text-indigo-600 dark:text-indigo-300 hover:underline">
                      {trans('generals.verbs.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            {Array.isArray(verbs) && verbs.length === 0 && (
              <tr>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300" colSpan={3}>
                  {trans('generals.no_data') || 'No data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
