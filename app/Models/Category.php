<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['key'];

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
