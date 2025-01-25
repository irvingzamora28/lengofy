<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticateOrRedirect
{
    public function handle(Request $request, Closure $next, string $redirectRouteName)
    {
        if (!Auth::check()) {
            $id = $request->route()->parameter('genderDuelGame') ?? 
                  $request->route()->parameter('memoryTranslationGame');
                  
            if (!$id) {
                return redirect()->route('login');
            }
            
            return redirect()->route($redirectRouteName, ['id' => $id]);
        }

        return $next($request);
    }
}
