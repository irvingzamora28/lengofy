<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Supported locales
        $supportedLocales = ['en', 'es', 'de'];
        $defaultLocale = 'en';

        // Determine locale priority:
        // 1. Session
        // 2. Cookie
        // 3. Browser language
        // 4. Default locale

        $locale = session('locale');

        if (!$locale) {
            $locale = $request->cookie('locale');
        }

        if (!$locale) {
            $locale = $request->getPreferredLanguage($supportedLocales);
        }

        if (!in_array($locale, $supportedLocales)) {
            $locale = $defaultLocale;
        }

        // Set the application locale
        app()->setLocale($locale);
        session(['locale' => $locale]);

        return $next($request);
    }
}
