<?php

namespace App\Services;

use App\Models\UpcomingFeature;
use App\Models\WaitlistSubscriber;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FeatureAnalyticsService
{
    public function getFeatureStats()
    {
        return DB::table('upcoming_features')
            ->select([
                'upcoming_features.id',
                'upcoming_features.name as feature',
                'feature_categories.name as category',
                DB::raw('COUNT(DISTINCT subscriber_feature_interests.subscriber_id) as total_interests')
            ])
            ->leftJoin('feature_categories', 'upcoming_features.feature_category_id', '=', 'feature_categories.id')
            ->leftJoin('subscriber_feature_interests', 'upcoming_features.id', '=', 'subscriber_feature_interests.feature_id')
            ->groupBy('upcoming_features.id', 'upcoming_features.name', 'feature_categories.name')
            ->get()
            ->map(function ($feature) {
                return [
                    'feature' => $feature->feature,
                    'category' => $feature->category,
                    'total_interests' => $feature->total_interests,
                ];
            });
    }

    public function getTopFeatures($limit = 5)
    {
        return DB::table('upcoming_features')
            ->select([
                'upcoming_features.name as feature',
                DB::raw('COUNT(DISTINCT subscriber_feature_interests.subscriber_id) as interests')
            ])
            ->leftJoin('subscriber_feature_interests', 'upcoming_features.id', '=', 'subscriber_feature_interests.feature_id')
            ->groupBy('upcoming_features.id', 'upcoming_features.name')
            ->orderByDesc('interests')
            ->limit($limit)
            ->get()
            ->map(function ($feature) {
                return [
                    'feature' => $feature->feature,
                    'interests' => $feature->interests,
                ];
            });
    }

    public function getOverallStats()
    {
        return [
            'total_features' => DB::table('upcoming_features')->count(),
            'total_subscribers' => DB::table('waitlist_subscribers')->count(),
            'total_interests' => DB::table('subscriber_feature_interests')->count(),
            'avg_interests_per_subscriber' => $this->calculateAverageInterestsPerSubscriber(),
        ];
    }

    private function calculateAverageInterestsPerSubscriber(): float
    {
        $totalSubscribers = DB::table('waitlist_subscribers')->count();
        if ($totalSubscribers === 0) {
            return 0.0;
        }

        $totalInterests = DB::table('subscriber_feature_interests')->count();
        return round($totalInterests / $totalSubscribers, 2);
    }
}
