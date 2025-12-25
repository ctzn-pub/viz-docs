import React from 'react';
import type { MDXComponents } from 'mdx/types';
import Image, { ImageProps } from 'next/image';
import { CopyButton } from '@/components/CopyButton';

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className="text-4xl font-extrabold tracking-tight mb-6 text-foreground font-geist-sans">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4 pb-1 border-b border-border text-foreground font-geist-sans">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-xl font-bold tracking-tight mt-8 mb-4 text-foreground font-geist-sans">{children}</h3>
        ),
        p: ({ children }) => (
            <p className="leading-7 [&:not(:first-child)]:mt-6 text-muted-foreground font-medium font-geist-sans">{children}</p>
        ),
        ul: ({ children }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-muted-foreground font-medium font-geist-sans">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 text-muted-foreground font-medium font-geist-sans">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-snug">{children}</li>,
        blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground/80 font-geist-sans">
                {children}
            </blockquote>
        ),
        img: (props) => (
            <div className="my-8 rounded-xl overflow-hidden border border-border shadow-sm">
                <Image
                    sizes="100vw"
                    style={{ width: '100%', height: 'auto' }}
                    {...(props as ImageProps)}
                    alt={props.alt || ''}
                />
            </div>
        ),
        code: ({ children }) => (
            <code className="relative rounded bg-secondary px-[0.3rem] py-[0.15rem] font-mono text-[0.85rem] font-bold text-foreground/80 border border-border/50">
                {children}
            </code>
        ),
        pre: ({ children, ...props }) => {
            // Extract text content for copying
            const textContent = React.Children.toArray(children)
                .map((child: any) => {
                    if (typeof child === 'string') return child;
                    if (child?.props?.children) {
                        if (typeof child.props.children === 'string') return child.props.children;
                        if (Array.isArray(child.props.children)) return child.props.children.join('');
                    }
                    return '';
                })
                .join('');

            return (
                <div className="relative group/pre my-6">
                    <pre className="overflow-x-auto rounded-xl bg-secondary/80 p-4 border border-border font-mono text-xs leading-relaxed text-foreground/90 shadow-sm" {...props}>
                        {children}
                    </pre>
                    <div className="absolute right-3 top-3 opacity-0 group-hover/pre:opacity-100 transition-opacity">
                        <CopyButton
                            text={textContent}
                            variant="ghost"
                            className="h-7 w-7 bg-background/50 hover:bg-background border border-border"
                        />
                    </div>
                </div>
            );
        },
        ...components,
    };
}
