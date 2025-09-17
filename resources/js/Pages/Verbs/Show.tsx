import { FormEvent, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";

// Types matching the controller payload
type VerbDto = {
    id: number;
    infinitive: string;
    translation?: string | null;
    is_irregular: boolean;
};

type TenseDto = { id: number; name: string; code: string };

type PronounDto = { id: number; display: string };

// conjugations: Record<tenseId, Array<{pronoun_id:number, form:string, notes?:string}>>
type Props = {
    auth: { user: any };
    verb: VerbDto;
    tenses: TenseDto[];
    pronouns: PronounDto[];
    conjugations: Record<
        string,
        Array<{ pronoun_id: number; form: string; notes?: string | null }>
    >;
};

export default function Show({
    auth,
    verb,
    tenses,
    pronouns,
    conjugations,
}: Props) {
    const title = `${verb.infinitive} – Conjugations`;
    const [query, setQuery] = useState<string>("");

    // Build a quick map for pronouns per tense for fast access
    const conjByTensePronoun = useMemo(() => {
        const m = new Map<
            number,
            Map<number, { form: string; notes?: string | null }>
        >();
        for (const [tenseIdStr, arr] of Object.entries(conjugations || {})) {
            const tenseId = Number(tenseIdStr);
            const inner = new Map<
                number,
                { form: string; notes?: string | null }
            >();
            for (const c of arr)
                inner.set(c.pronoun_id, { form: c.form, notes: c.notes });
            m.set(tenseId, inner);
        }
        return m;
    }, [conjugations]);

    return (
        <AuthenticatedLayout
            header={
                <>
                <div className="flex items-center justify-between gap-3 dark:text-gray-100">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">
                            {verb.infinitive}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {verb.translation ? verb.translation : ""}
                            {verb.is_irregular && (
                                <span className="ml-2 inline-flex items-center text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                    irregular
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Desktop search (to the left of back button) */}
                        <form
                            onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                const value = query.trim();
                                const params: Record<string, any> = { q: value };
                                const currentParams = new URLSearchParams(window.location.search);
                                const langId = currentParams.get('lang_id');
                                if (langId) params.lang_id = langId;
                                router.get(route('verbs.index'), params, { preserveState: true });
                            }}
                            className="hidden md:flex items-center gap-2"
                        >
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                type="text"
                                placeholder="Search another verb..."
                                className="md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100"
                            />
                            <button
                                type="submit"
                                aria-label="Search"
                                className="p-3 rounded bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 flex items-center justify-center"
                            >
                                <FiSearch className="w-4 h-4" />
                            </button>
                        </form>
                        <Link
                            href={route("verbs.index")}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            <FiArrowLeft />
                            Back to Verbs
                        </Link>
                    </div>
                </div>
                {/* Mobile search below the top row */}
                <form
                    onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        const value = query.trim();
                        const params: Record<string, any> = { q: value };
                        const currentParams = new URLSearchParams(window.location.search);
                        const langId = currentParams.get('lang_id');
                        if (langId) params.lang_id = langId;
                        router.get(route('verbs.index'), params, { preserveState: true });
                    }}
                    className="mt-2 md:hidden flex items-center gap-2"
                >
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        type="text"
                        placeholder="Search another verb..."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <button
                        type="submit"
                        aria-label="Search"
                        className="p-3 rounded bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 flex items-center justify-center"
                    >
                        <FiSearch className="w-4 h-4" />
                    </button>
                </form>
                </>
            }
        >
            <Head title={title} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Tense cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 md:p-0 dark:text-gray-100">
                        {tenses.map((tense) => (
                            <motion.div
                                key={tense.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-gray-800 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700"
                            >
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20">
                                    <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                                        {tense.name}
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {pronouns.map((p) => {
                                                const conjugation = conjByTensePronoun.get(tense.id)?.get(p.id);
                                                const form = conjugation?.form ?? "—";
                                                const notes = conjugation?.notes;
                                                const isIrregular = verb.is_irregular && form !== "—" && notes?.includes("irregular");

                                                return (
                                                    <tr
                                                        key={p.id}
                                                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                    >
                                                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium">
                                                            {p.display}
                                                        </td>
                                                        <td className="py-2 font-medium relative group">
                                                            <div className="flex items-center">
                                                                <span className={`${isIrregular ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                                                                    {form}
                                                                </span>
                                                                {notes && (
                                                                    <div className="relative ml-2">
                                                                        <FiInfo className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-gray-700 rounded shadow-lg text-xs text-gray-700 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                                            {notes}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
