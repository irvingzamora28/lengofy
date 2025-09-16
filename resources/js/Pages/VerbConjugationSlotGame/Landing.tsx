import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestLanguageModal from '../../Components/GuestLanguageModal';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import GuestLayout from '@/Layouts/GuestLayout';
import { FaPlay, FaBolt, FaKeyboard, FaGlobe } from 'react-icons/fa';
import vcsImage from '@/assets/images/verb-conjugation-slot-dashboard.png';

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
  const { t: trans } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const openLanguageModal = () => setShowLanguageModal(true);
  const closeLanguageModal = () => setShowLanguageModal(false);
  const features = [
    { icon: <FaKeyboard className="w-8 h-8" />, title: trans('verb_conjugation_slot_landing_page.feature_1_title'), description: trans('verb_conjugation_slot_landing_page.feature_1_description') },
    { icon: <FaBolt className="w-8 h-8" />, title: trans('verb_conjugation_slot_landing_page.feature_2_title'), description: trans('verb_conjugation_slot_landing_page.feature_2_description') },
    { icon: <FaGlobe className="w-8 h-8" />, title: trans('verb_conjugation_slot_landing_page.feature_3_title'), description: trans('verb_conjugation_slot_landing_page.feature_3_description') },
  ];

  return (
    <GuestLayout>
      <Head>
        <title>{trans('verb_conjugation_slot_landing_page.meta_title')}</title>
        <meta name="description" content={trans('verb_conjugation_slot_landing_page.meta_description')} />
        <meta name="keywords" content={trans('verb_conjugation_slot_landing_page.meta_keywords')} />
        <meta property="og:title" content={trans('verb_conjugation_slot_landing_page.meta_title')} />
        <meta property="og:description" content={trans('verb_conjugation_slot_landing_page.meta_description')} />
        <meta property="og:image" content={vcsImage} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-black">
        {/* Hero */}
        <section className="pt-24 pb-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
              {trans('verb_conjugation_slot_landing_page.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              {trans('verb_conjugation_slot_landing_page.description')}
            </p>
            <button onClick={openLanguageModal} className="px-12 py-6 text-xl md:text-3xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center space-x-3 transform hover:scale-105 transition mx-auto">
              <FaPlay className="w-6 h-6" /> <span>{trans('verb_conjugation_slot_landing_page.play_now')}</span>
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:scale-105 transition-transform">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 text-indigo-500 dark:text-indigo-400">{f.icon}</div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">{f.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl" />
              <img src={vcsImage} alt="Game Preview" className="rounded-xl shadow-2xl relative z-10 mx-auto" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 text-center text-gray-600 dark:text-gray-400">
          <p>{trans('generals.copyright')}</p>
        </footer>
      </div>

      <AnimatePresence>
        {showLanguageModal && (
          <GuestLanguageModal
            show={showLanguageModal}
            redirectRoute="games.verb-conjugation-slot.lobby"
            onClose={closeLanguageModal}
            languagePairs={languagePairs}
          />
        )}
      </AnimatePresence>
    </GuestLayout>
  );
}
