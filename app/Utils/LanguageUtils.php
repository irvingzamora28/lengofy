<?php

namespace App\Utils;

/**
 * Utility class for language-related helper functions
 */
class LanguageUtils
{
    /**
     * Get the full language name from a language code
     *
     * @param string $code The language code (e.g., 'en', 'es')
     * @return string The language name
     */
    public static function getLanguageName(string $code): string
    {
        $languages = [
            'en' => 'English',
            'es' => 'Spanish',
            'de' => 'German',
            'fr' => 'French',
            'it' => 'Italian',
            'pt' => 'Portuguese',
            'ru' => 'Russian',
            'zh' => 'Chinese',
            'ja' => 'Japanese',
            'ko' => 'Korean',
        ];

        return $languages[$code] ?? $code;
    }

    /**
     * Get the country code for a language code
     *
     * @param string $languageCode The language code
     * @return string The country code
     */
    public static function getCountryCode(string $languageCode): string
    {
        $countryCodes = [
            'en' => 'US',
            'es' => 'ES',
            'fr' => 'FR',
            'de' => 'DE',
            'it' => 'IT',
            'pt' => 'PT',
            'nl' => 'NL',
            'ru' => 'RU',
            'ja' => 'JP',
            'zh' => 'CN',
            'ar' => 'SA',
            'hi' => 'IN',
            'ko' => 'KR',
            'tr' => 'TR',
            'pl' => 'PL',
            'vi' => 'VN',
            'th' => 'TH',
            'id' => 'ID',
            'ms' => 'MY',
            'fa' => 'IR',
        ];

        return $countryCodes[$languageCode] ?? strtoupper($languageCode);
    }
}
