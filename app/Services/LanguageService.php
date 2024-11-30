<?php

namespace App\Services;

class LanguageService
{
    /**
     * Get the flag emoji for a language code
     */
    public function getFlag(string $code): string
    {
        return match ($code) {
            'de' => '🇩🇪',
            'en' => '🇬🇧',
            'es' => '🇪🇸',
            'fr' => '🇫🇷',
            'it' => '🇮🇹',
            default => '🏳️',
        };
    }

    /**
     * Get the learning phrase for a language code
     */
    public function getLearningPhrase(string $code): string
    {
        return match ($code) {
            'de' => 'Ich lerne',
            'en' => 'I am learning',
            'es' => 'Estoy aprendiendo',
            'fr' => 'J\'apprends',
            'it' => 'Sto imparando',
            default => 'I am learning',
        };
    }

    /**
     * Get all supported language codes
     */
    public function getSupportedLanguages(): array
    {
        return ['de', 'en', 'es', 'fr', 'it'];
    }
}
