<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['key'];

    public function nouns()
    {
        return $this->belongsToMany(Noun::class, 'category_noun', 'category_id', 'noun_id');
    }

    public function getName(string $locale = null): string
    {
        $locale = $locale ?? app()->getLocale();
        return __("categories.{$this->key}", [], $locale);
    }

    public static function getAllTranslated(string $locale = null): array
    {
        $locale = $locale ?? app()->getLocale();
        return static::all()->map(function ($category) use ($locale) {
            return [
                'id' => $category->id,
                'key' => $category->key,
                'name' => $category->getName($locale)
            ];
        })->all();
    }
}
