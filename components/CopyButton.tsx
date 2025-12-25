'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
    text: string;
    className?: string;
    iconClassName?: string;
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
}

export function CopyButton({ text, className, iconClassName, variant = "outline" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Button
            variant={variant}
            size="icon"
            onClick={handleCopy}
            className={cn("h-8 w-8 relative overflow-hidden transition-all duration-200", className)}
        >
            <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                copied ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}>
                <Check className={cn("h-4 w-4 text-green-500", iconClassName)} />
            </div>
            <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                copied ? "-translate-y-8 opacity-0" : "translate-y-0 opacity-100"
            )}>
                <Copy className={cn("h-4 w-4", iconClassName)} />
            </div>
        </Button>
    );
}
