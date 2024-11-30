import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';

interface Props {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    languagePairs: Record<string, string>;
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

    return (
        <div className={className}>
            <InputLabel htmlFor="language_pair_id" value="Language Pair" />

            <Select
                id="language_pair_id"
                className="mt-1 block w-full"
                value={currentValue}
                onChange={(e) => onChange(e.target.value)}
                required
            >
                {Object.entries(languagePairs).map(([id, name]) => (
                    <option key={id} value={id}>
                        {name}
                    </option>
                ))}
            </Select>

            {error && <InputError className="mt-2" message={error} />}
        </div>
    );
}
