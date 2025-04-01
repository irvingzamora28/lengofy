import React, { ReactNode } from 'react';
import MobileNavigation, { MobileTab } from '@/Components/Navigation/MobileNavigation';

interface TabContentProps {
    children: ReactNode;
}

const TabContent: React.FC<TabContentProps> = ({ children }) => {
    return (
        <div className="sm:hidden">
            {children}
        </div>
    );
};

interface DesktopContentProps {
    children: ReactNode;
}

const DesktopContent: React.FC<DesktopContentProps> = ({ children }) => {
    return (
        <div className="hidden sm:block space-y-3 sm:space-y-4">
            {children}
        </div>
    );
};

export interface TabConfig {
    key: MobileTab;
    content: ReactNode;
}

interface TabLayoutProps {
    activeTab: MobileTab;
    onTabChange: (tab: MobileTab) => void;
    renderTabContent?: (activeTab: MobileTab) => ReactNode;
    tabs?: TabConfig[];
    desktopContent?: ReactNode;
    showMobileNavigation?: boolean;
    customNavigation?: ReactNode;
}

const TabLayout: React.FC<TabLayoutProps> = ({
    activeTab,
    onTabChange,
    renderTabContent,
    tabs,
    desktopContent,
    showMobileNavigation = true,
    customNavigation
}) => {
    // Determine the content to render based on either tabs array or renderTabContent function
    const getTabContent = () => {
        if (tabs) {
            // Find the active tab in the tabs array
            const activeTabConfig = tabs.find(tab => tab.key === activeTab);
            return activeTabConfig ? activeTabConfig.content : null;
        } else if (renderTabContent) {
            // Use the renderTabContent function if provided
            return renderTabContent(activeTab);
        }
        return null;
    };

    return (
        <>
            {/* Mobile View - Show content based on active tab */}
            <TabContent>
                {getTabContent()}
            </TabContent>

            {/* Desktop View - Show all content */}
            {desktopContent && (
                <DesktopContent>
                    {desktopContent}
                </DesktopContent>
            )}

            {/* Mobile Navigation */}
            {showMobileNavigation && (
                <div className="sm:hidden">
                    {customNavigation || (
                        <MobileNavigation
                            activeTab={activeTab as MobileTab}
                            onTabChange={(tab) => onTabChange(tab)}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default TabLayout;
export { TabContent, DesktopContent };
