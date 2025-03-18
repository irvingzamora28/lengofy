<?php

namespace App\Services;

class DictionaryService
{
    /**
     * Validate if a word exists in the dictionary for the given language
     *
     * @param string $word The word to validate
     * @param string $language The language code (e.g., 'en', 'es')
     * @return bool
     */
    public function validateWord(string $word, string $language): bool
    {
        // TODO: Implement actual dictionary validation logic
        // For now, return true for testing purposes
        return true;
    }
}