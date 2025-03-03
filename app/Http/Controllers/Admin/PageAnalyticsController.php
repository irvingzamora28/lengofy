<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Services\PageAnalyticsService;
use Inertia\Inertia;

#[EnsureUserIsAdmin]
class PageAnalyticsController extends Controller
{
    protected $analyticsService;

    public function __construct(PageAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function index()
    {
        $logStatus = $this->analyticsService->checkLogFileStatus();
        
        return Inertia::render('Admin/PageAnalytics', [
            'pageViews' => $this->analyticsService->getPageViews(),
            'visitors' => $this->analyticsService->getVisitors(),
            'topPages' => $this->analyticsService->getTopPages(),
            'referrers' => $this->analyticsService->getReferrers(),
            'logStatus' => $logStatus,
        ]);
    }
}
