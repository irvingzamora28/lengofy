import genderDuelDashboardImage from "@/assets/images/gender-duel-dashboard.png";
import memoryTranslationDashboardImage from "@/assets/images/memory-translation-dashboard.png";
import wordSearchPuzzleDashboardImage from "@/assets/images/word-search-puzzle-dashboard.png";

export const GAME_THUMBNAILS: Record<string, string> = {
    'gender-duel': genderDuelDashboardImage,
    'memory-translation': memoryTranslationDashboardImage,
    'word-search-puzzle': wordSearchPuzzleDashboardImage,
};

export const GAME_DESCRIPTIONS: Record<string, string> = {
    'gender-duel': 'Master German noun genders through an exciting dueling game!',
    'memory-translation': 'Test your German vocabulary with fun memory games! Match cards to find the hidden translations and challenge your memory.',
    'word-search-puzzle': 'Challenge your friends in a fast-paced word puzzle game!',
};
