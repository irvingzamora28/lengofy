<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

#[\Attribute]
class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::guard('admin')->check()) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Unauthorized. Admin access required.'], 403);
            }
            
            return redirect()->route('admin.login')->with('error', 'Please login as an administrator.');
        }

        return $next($request);
    }
}
