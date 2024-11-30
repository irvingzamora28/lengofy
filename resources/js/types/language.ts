export interface Language {
    code: string;
    name: string;
    flag: string;
}

export interface LanguagePair {
    id: string;
    sourceLanguage: Language;
    targetLanguage: Language;
}

export const learningPhrases: Record<string, string> = {
    'de': 'Ich lerne',
    'en': 'I am learning',
    'es': 'Estoy aprendiendo',
    'fr': 'J\'apprends',
    'it': 'Sto imparando',
};
