'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronDown,
    ChevronRight,
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'recharts/generic': <LineChart className="w-5 h-5" />,
    'recharts/brfss': <Activity className="w-5 h-5" />,
    'recharts/gss': <Search className="w-5 h-5" />,
    'recharts/ess': <Database className="w-5 h-5" />,
    'plot/gss': <PieChart className="w-5 h-5" />,
    'plot/geo': <Map className="w-5 h-5" />,
    'plot/health': <Activity className="w-5 h-5" />,
    'plot/brfss': <BarChart3 className="w-5 h-5" />,
    'plot/timeseries': <LineChart className="w-5 h-5" />,
    'plot/stats': <Target className="w-5 h-5" />,
    'composite/dashboards': <Layout className="w-5 h-5" />,
};

const DOMAIN_ORDER = ['Generic', 'Health', 'Survey', 'Geographic', 'Statistical', 'Dashboards'] as const;

export function Sidebar() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu when route changes
    React.useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Filter registry based on search query
    const filteredRegistry = Object.entries(REGISTRY).reduce((acc, [key, category]) => {
        const filteredComponents = category.components.filter(
            comp =>
                comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                key.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredComponents.length > 0) {
            acc[key] = { ...category, components: filteredComponents };
        }
        return acc;
    }, {} as typeof REGISTRY);

    // Group by Domain
    const domainGroups = Object.entries(filteredRegistry).reduce((acc, [key, category]) => {
        const domain = category.domain;
        if (!acc[domain]) acc[domain] = [];
        acc[domain].push({ key, ...category });
        return acc;
    }, {} as Record<string, any[]>);

    // Sort domains by predefined order
    const sortedDomains = DOMAIN_ORDER.filter(domain => domainGroups[domain]);

    // Auto-expand categories when searching
    React.useEffect(() => {
        if (searchQuery.length > 0) {
            setExpandedCategories(Object.keys(filteredRegistry));
        }
    }, [searchQuery]);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary rounded-lg shadow-sm">
                        <BarChart3 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground">Evidence</span>
                </div>
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
                    <div className="flex items-center space-x-3 max-md:hidden">
                        <div className="p-2 bg-primary rounded-lg shadow-sm">
                            <BarChart3 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-foreground">Evidence</span>
                    </div>

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

            {/* Categories - Scrollable */}
            <nav className="flex-1 px-3 space-y-8 py-8 overflow-y-auto custom-scrollbar">
                {sortedDomains.map((domain) => (
                    <div key={domain} className="space-y-3">
                        <div className="px-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                                {domain}
                            </span>
                        </div>

                        <div className="space-y-0.5">
                            {domainGroups[domain].map((category) => {
                                const key = category.key;
                                const isExpanded = expandedCategories.includes(key);
                                const isActive = pathname.includes(key);

                                return (
                                    <div key={key} className="space-y-0.5">
                                        <button
                                            onClick={() => toggleCategory(key)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors group text-left",
                                                isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                            )}
                                        >
                                            <div className="flex items-center space-x-2.5">
                                                <span className={cn(
                                                    "transition-opacity duration-200",
                                                    isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                                                )}>
                                                    {CATEGORY_ICONS[key] || <BookOpen className="w-4 h-4" />}
                                                </span>
                                                <span className="text-xs font-semibold">
                                                    {category.title.split(' (')[0].replace('recharts/', '').replace('plot/', '')}
                                                </span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="w-3 h-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="ml-4 border-l border-sidebar-border space-y-0.5 overflow-hidden"
                                                >
                                                    {category.components.map((comp: any) => {
                                                        const path = `${key}/${comp.id}`;
                                                        const isCompActive = pathname === `/${path}`;
                                                        return (
                                                            <Link
                                                                key={comp.id}
                                                                href={`/${path}`}
                                                                className={cn(
                                                                    "block py-1.5 px-5 text-[13px] transition-all border-l-2 -ml-[1px]",
                                                                    isCompActive
                                                                        ? "text-foreground font-semibold border-primary bg-secondary/50"
                                                                        : "text-muted-foreground hover:text-foreground border-transparent hover:border-sidebar-border"
                                                                )}
                                                            >
                                                                {comp.name}
                                                            </Link>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredRegistry).length === 0 && (
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
