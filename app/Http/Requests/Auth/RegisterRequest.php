<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Password::defaults()],
            'language_pair_id' => 'required|exists:language_pairs,id',
            // validate redirect_route
            'redirect_route' => ['nullable', 'string', Rule::in(['games.gender-duel.join-from-invite', 'games.memory-translation.join-from-invite'])],
            // validate game_id
            'game_id' => ['nullable', 'required_if:redirect_route,games.gender-duel.join-from-invite,games.memory-translation.join-from-invite', 'integer'],
        ];
    }
}
