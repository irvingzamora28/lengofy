<?php

namespace App\Services;

use App\Models\Noun;

class NounService {

    public function getNouns(int $language_id, int $translation_language_id, int $category_id, int $totalRounds): array {
        $query = Noun::where('language_id', $language_id);
        if ($category_id !== 0) {
            $query->whereHas('categories', function ($query) use ($category_id) {
                $query->where('category_id', $category_id);
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
                'translation' => $noun->getTranslation($translation_language_id),
            ])
            ->toArray();
    }
}
