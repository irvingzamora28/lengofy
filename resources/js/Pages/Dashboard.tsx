import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps, Score, Game, Lesson } from "@/types";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaGamepad } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { MobileTab } from "@/Components/Navigation/MobileNavigation";
import TabLayout, { TabConfig } from "@/Components/Layout/TabLayout";
import { getSharedTabs, getSharedDesktopContent } from "@/Config/TabsConfig";

interface DashboardProps extends PageProps {
    scores: Score[];
    games: Game[];
    lessons: Lesson[];
}

export default function Dashboard({ scores, games, lessons, activeTab: initialActiveTab }: DashboardProps & { activeTab?: MobileTab }) {
    const { t: trans } = useTranslation();

    // Check URL parameters for activeTab
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('activeTab') as MobileTab | null;

    // Validate that tabFromUrl is a valid MobileTab value
    const isValidTab = (tab: string | null): tab is MobileTab => {
        return tab === 'home' || tab === 'games' || tab === 'stats' || tab === 'leaderboard' || tab === 'lessons';
    };

    // Use URL parameter first (if valid), then prop, then default to 'home'
    const effectiveTab: MobileTab = isValidTab(tabFromUrl) ? tabFromUrl : (initialActiveTab || 'home');

    const [activeTab, setActiveTab] = useState<MobileTab>(effectiveTab);

    // Log for debugging
    useEffect(() => {
        console.log('Dashboard activeTab sources:', {
            fromUrl: tabFromUrl,
            fromProps: initialActiveTab,
            effective: effectiveTab
        });
    }, [tabFromUrl, initialActiveTab, effectiveTab]);

    useEffect(() => {
        // Call CSRF cookie endpoint when component mounts
        axios.get("/sanctum/csrf-cookie").then(() => {
            // CSRF cookie is set; now we can make authenticated requests
        });
    }, []);

    // Get shared tabs and desktop content from config
    const dashboardTabs = getSharedTabs({ games, lessons, scores, trans });
    const desktopContent = getSharedDesktopContent({ games, lessons, scores, trans });

    return (
        <AuthenticatedLayout>
            <Head title={trans("auth_layout.dashboard")} />

            <div className="py-4 sm:py-6 lg:py-8">
                <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 space-y-3 sm:space-y-4">
                    <TabLayout
                        activeTab={activeTab}
                        onTabChange={(tab: MobileTab) => setActiveTab(tab)}
                        tabs={dashboardTabs}
                        desktopContent={desktopContent}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
