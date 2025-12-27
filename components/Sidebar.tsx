'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Map,
    Layout,
    Activity,
    Database,
    Search,
    BookOpen,
    PieChart,
    LineChart,
    Target,
    Menu,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { REGISTRY } from '@/lib/registry-data';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const DOMAIN_ORDER = ['Generic', 'Health', 'Survey', 'Geographic', 'Statistical', 'Dashboards'] as const;

// Build a flat list of nav items grouped by domain
function buildNavItems() {
    const items: {
        domain: string;
        name: string;
        path: string;
        icon: React.ReactNode;
    }[] = [];

    for (const [categoryPath, category] of Object.entries(REGISTRY)) {
        // Add families as direct links
        if (category.families) {
            for (const family of category.families) {
                items.push({
                    domain: category.domain,
                    name: family.name,
                    path: `/${categoryPath}/${family.id}`,
                    icon: <LineChart className="w-4 h-4" />,
                });
            }
        }
        // Add standalone components as direct links
        if (category.components) {
            for (const comp of category.components) {
                items.push({
                    domain: category.domain,
                    name: comp.name,
                    path: `/${categoryPath}/${comp.id}`,
                    icon: getIconForCategory(categoryPath),
                });
            }
        }
    }

    return items;
}

function getIconForCategory(categoryPath: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
        'recharts/generic': <LineChart className="w-4 h-4" />,
        'recharts/brfss': <Activity className="w-4 h-4" />,
        'recharts/gss': <Search className="w-4 h-4" />,
        'recharts/ess': <Database className="w-4 h-4" />,
        'plot/gss': <PieChart className="w-4 h-4" />,
        'plot/geo': <Map className="w-4 h-4" />,
        'plot/health': <Activity className="w-4 h-4" />,
        'plot/brfss': <BarChart3 className="w-4 h-4" />,
        'plot/timeseries': <LineChart className="w-4 h-4" />,
        'plot/stats': <Target className="w-4 h-4" />,
        'composite/dashboards': <Layout className="w-4 h-4" />,
    };
    return icons[categoryPath] || <BookOpen className="w-4 h-4" />;
}

export function Sidebar() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu when route changes
    React.useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const allItems = buildNavItems();

    // Filter based on search
    const filteredItems = searchQuery
        ? allItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.domain.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allItems;

    // Group by domain
    const groupedByDomain = DOMAIN_ORDER.reduce((acc, domain) => {
        const domainItems = filteredItems.filter(item => item.domain === domain);
        if (domainItems.length > 0) {
            acc[domain] = domainItems;
        }
        return acc;
    }, {} as Record<string, typeof allItems>);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="p-2 bg-primary rounded-lg shadow-sm">
                        <BarChart3 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground">Viz Docs</span>
                </Link>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-md hover:bg-secondary transition-colors"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 z-30 bg-black/50"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className={cn(
                "w-64 bg-sidebar h-screen sticky top-0 border-r border-sidebar-border flex flex-col overflow-hidden z-40",
                "max-md:fixed max-md:top-0 max-md:left-0 max-md:pt-16 max-md:transition-transform max-md:duration-300",
                mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
            )}>
                {/* Logo and Search */}
                <div className="p-6 pb-0 space-y-6 shrink-0">
                    <Link href="/" className="flex items-center space-x-3 max-md:hidden hover:opacity-80 transition-opacity">
                        <div className="p-2 bg-primary rounded-lg shadow-sm">
                            <BarChart3 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-foreground">Viz Docs</span>
                    </Link>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="Search components..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary border border-sidebar-border rounded-md py-1.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Navigation - Direct Links */}
                <nav className="flex-1 px-3 space-y-8 py-8 overflow-y-auto custom-scrollbar">
                    {Object.entries(groupedByDomain).map(([domain, items]) => (
                        <div key={domain} className="space-y-2">
                            <div className="px-3">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                                    {domain}
                                </span>
                            </div>

                            <div className="space-y-0.5">
                                {items.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={cn(
                                                "flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13px]",
                                                isActive
                                                    ? "text-foreground font-semibold bg-secondary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                            )}
                                        >
                                            <span className={cn(
                                                "transition-opacity",
                                                isActive ? "opacity-100" : "opacity-50"
                                            )}>
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {Object.keys(groupedByDomain).length === 0 && (
                        <div className="py-8 text-center px-4">
                            <p className="text-xs text-muted-foreground italic">No components found</p>
                        </div>
                    )}
                </nav>

                {/* Sticky Footer */}
                <div className="p-4 border-t border-sidebar-border space-y-4 shrink-0 bg-sidebar/50 backdrop-blur-sm">
                    <ThemeToggle />
                    <Link
                        href="/docs/intro"
                        className="flex items-center space-x-2.5 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <BookOpen className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                        <span className="font-medium">Documentation</span>
                    </Link>
                    <div className="flex items-center space-x-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-tighter font-bold text-muted-foreground">Version 0.1.0-alpha</span>
                    </div>
                </div>
            </div>
        </>
    );
}
