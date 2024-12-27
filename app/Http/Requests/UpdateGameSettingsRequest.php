<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'gender_duel_difficulty' => 'sometimes|in:easy,medium,hard',
            'gender_duel_sound' => 'sometimes|boolean',
            'gender_duel_timer' => 'sometimes|boolean',
        ];
    }
}
