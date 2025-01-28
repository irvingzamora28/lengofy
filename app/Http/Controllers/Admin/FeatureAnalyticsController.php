<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Services\FeatureAnalyticsService;
use Inertia\Inertia;

#[EnsureUserIsAdmin]
class FeatureAnalyticsController extends Controller
{
    protected $analyticsService;

    public function __construct(FeatureAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function index()
    {
        return Inertia::render('Admin/FeatureAnalytics', [
            'overallStats' => $this->analyticsService->getOverallStats(),
            'featureStats' => $this->analyticsService->getFeatureStats(),
            'topFeatures' => $this->analyticsService->getTopFeatures(5)
        ]);
    }
}
