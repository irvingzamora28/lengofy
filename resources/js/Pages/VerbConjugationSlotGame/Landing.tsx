import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestLanguageModal from '../../Components/GuestLanguageModal';

type LanguageInfo = {
  code: string;
  name: string;
  flag: string;
};

type LanguagePair = {
  id: number;
  sourceLanguage: LanguageInfo;
  targetLanguage: LanguageInfo;
};

type Props = {
  languagePairs: Record<string, LanguagePair>;
  locale: string;
};

export default function Landing({ languagePairs, locale }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Verb Conjugation Slot" />
      <div className="max-w-5xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-4">Verb Conjugation Slot Machine</h1>
        <p className="text-gray-600 mb-8">
          Practice verb conjugations with a fun slot-machine style game. Pick a language pair and jump in!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {Object.values(languagePairs || {}).map((pair) => (
            <div key={pair.id} className="rounded-lg border bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pair.sourceLanguage.flag}</span>
                <span className="text-gray-800">{pair.sourceLanguage.name}</span>
                <span>→</span>
                <span className="text-2xl">{pair.targetLanguage.flag}</span>
                <span className="text-gray-800">{pair.targetLanguage.name}</span>
              </div>
              <Link
                href={route('gender-duel.play')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Change
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={route('games.verb-conjugation-slot.lobby')}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Go to Lobby
          </Link>
          <Link
            href={route('login')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Login
          </Link>
        </div>
      </div>

      <GuestLanguageModal locale={locale} />
    </div>
  );
}
