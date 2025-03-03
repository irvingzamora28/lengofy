<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

#[EnsureUserIsAdmin]
class UsersController extends Controller
{
    public function index()
    {
        $users = User::with('languagePair.sourceLanguage', 'languagePair.targetLanguage')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function show($id)
    {
        $user = User::with([
            'languagePair.sourceLanguage', 
            'languagePair.targetLanguage',
            'lessonProgress',
            'scores'
        ])->findOrFail($id);

        return Inertia::render('Admin/UserDetail', [
            'user' => $user,
        ]);
    }
}
