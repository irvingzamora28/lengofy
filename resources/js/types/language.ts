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

export const selectLanguagePairs: Record<string, string> = {
    'en': 'Select your language pair',
    'es': 'Seleccione su par de idiomas',
    'de': 'Wahlen Sie Ihr Sprachpaar',
    'fr': 'Choisissez votre paire de langues',
    'it': 'Scegli la tua coppia di lingue',
};

export const helperLanguagePairSelectTextP1: Record<string, string> = {
    'en': `You speak `,
    'es': 'Usted habla ',
    'de': 'Sie sprechen ',
    'fr': 'Vous parlez ',
    'it': 'Ti parli ',
};

export const helperLanguagePairSelectTextP2: Record<string, string> = {
    'en': `and want to learn`,
    'es': 'y quiere aprender',
    'de': 'und mochten lernen',
    'fr': 'et voulez apprendre',
    'it': 'e vorresti imparare',
};


export const helperLanguagePairSelectText: Record<string, string> = {
    'en': 'Select the language you speak and the language you want to learn',
    'es': 'Seleccione el idioma que habla y el idioma que desea aprender',
    'de': 'Wählen Sie die Sprache, die Sie sprechen und die Sprache, die Sie lernen möchten',
    'fr': 'Choisissez la langue que vous parlez et la langue que vous voulez apprendre',
    'it': 'Scegli la lingua con la quale parli e la lingua con la quale vorresti imparare',
};
