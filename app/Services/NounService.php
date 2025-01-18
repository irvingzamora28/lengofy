<?php

namespace App\Services;

use App\Models\Noun;

class NounService {

    public function getNouns(int $languageId, int $translationLanguageId, int $categoryId, int $totalRounds): array {
        $query = Noun::where('language_id', $languageId);
        if ($categoryId !== 0) {
            $query->whereHas('categories', function ($query) use ($categoryId) {
                $query->where('category_id', $categoryId);
            });
        }
        return $query->inRandomOrder()
            ->limit($totalRounds)
            ->get()
            ->map(fn($noun) => [
                'id' => $noun->id,
                'word' => $noun->word,
                'gender' => $noun->gender,
                'emoji' => $noun->emoji,
                'translation' => $noun->getTranslation($translationLanguageId),
            ])
            ->toArray();
    }
}
