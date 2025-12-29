'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
    items: { id: string; name: string }[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0% -60% 0%'
            }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [items]);

    return (
        <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                On this page
            </span>
            <ul className="space-y-1 pt-2">
                {items.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            className={cn(
                                "block py-1 text-sm transition-colors border-l-2 pl-3 -ml-px",
                                activeId === item.id
                                    ? "border-primary text-foreground font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            {item.name}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
