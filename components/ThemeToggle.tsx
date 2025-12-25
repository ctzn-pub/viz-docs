'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex bg-secondary/50 rounded-lg p-1 border border-border w-full">
                <div className="flex-1 h-7 animate-pulse bg-muted rounded-md" />
            </div>
        );
    }

    const modes = [
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'dark', icon: Moon, label: 'Dark' },
        { id: 'system', icon: Monitor, label: 'System' },
    ] as const;

    return (
        <div className="flex bg-secondary/50 rounded-lg p-1 border border-border w-full">
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => setTheme(mode.id)}
                    className={cn(
                        "flex-1 flex items-center justify-center py-1 rounded-md transition-all group relative",
                        theme === mode.id
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                    )}
                    title={mode.label}
                >
                    <mode.icon className={cn(
                        "w-3.5 h-3.5",
                        theme === mode.id ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                    )} />
                    {theme === mode.id && (
                        <span className="sr-only">{mode.label}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
