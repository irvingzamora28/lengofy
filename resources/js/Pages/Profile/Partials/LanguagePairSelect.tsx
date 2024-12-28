import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';
import { LanguagePair, learningPhrases, selectLanguagePairs, helperLanguagePairSelectText, helperLanguagePairSelectTextP1, helperLanguagePairSelectTextP2 } from '@/types/language';

interface Props {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    languagePairs: Record<string, LanguagePair>;
    className?: string;
}

export default function LanguagePairSelect({
    value,
    onChange,
    error,
    languagePairs,
    className = '',
}: Props) {
    // Get the first language pair ID if available for default value
    const defaultLanguagePairId = Object.keys(languagePairs)[0] || '';
    const currentValue = value || defaultLanguagePairId;
    const currentPair = languagePairs[currentValue];

    const getLearningPhrase = (sourceCode: string, targetLanguage: string) => {
        return `${learningPhrases[sourceCode] || 'I am learning'} ${targetLanguage}`;
    };

    const getHelperText = (sourceCode: string, sourceLanguage: string, targetLanguage: string) => {
        return `${helperLanguagePairSelectTextP1[sourceCode] || 'You speak'} ${sourceLanguage} ${helperLanguagePairSelectTextP2[sourceCode] || 'and want to learn'} ${targetLanguage}`;
    };

    return (
        <div className={className}>
            <InputLabel
                htmlFor="language_pair_id"
                value={currentPair
                    ? getLearningPhrase(currentPair.sourceLanguage.code, currentPair.targetLanguage.name)
                    : selectLanguagePairs[currentValue]
                }
            />

            <div className="mt-1 relative">
                <Select
                    id="language_pair_id"
                    className="block w-full pl-10 pr-10"
                    value={currentValue}
                    onChange={(e) => onChange(e.target.value)}
                    required
                >
                    {Object.entries(languagePairs).map(([id, pair]) => (
                        <option key={id} value={id}>
                            {pair.sourceLanguage.flag} {pair.sourceLanguage.name} → {pair.targetLanguage.flag} {pair.targetLanguage.name}
                        </option>
                    ))}
                </Select>
            </div>

            {/* Helper Text */}
            <p className="mt-2 text-sm text-gray-500">
                {currentPair
                    ? getHelperText(currentPair.sourceLanguage.code, currentPair.sourceLanguage.name, currentPair.targetLanguage.name)
                    : helperLanguagePairSelectText[currentValue]
                }
            </p>

            {error && <InputError className="mt-2" message={error} />}
        </div>
    );
}
