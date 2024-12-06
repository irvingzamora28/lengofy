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
        // 1. URL parameter
        // 2. Session
        // 3. Cookies
        // 4. Browser language
        // 5. Default locale

        $locale = $request->input('locale');

        if (!$locale && $request->session()->has('locale')) {
            $locale = $request->session()->get('locale');
        }

        if (!$locale && $request->hasCookie('locale')) {
            $locale = $request->cookie('locale');
        }

        if (!$locale) {
            $locale = $request->getPreferredLanguage($supportedLocales);
        }

        // Validate and set locale
        $locale = in_array($locale, $supportedLocales) ? $locale : $defaultLocale;

        // Set the application locale
        App::setLocale($locale);
        Session::put('locale', $locale);

        return $next($request);
    }
}
