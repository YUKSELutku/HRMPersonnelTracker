// Path: NextFrontend/src/components/layout/ErrorBoundary.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="text-5xl">⚠️</div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Bir hata oluştu / An error occurred
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            {this.state.error?.message ?? 'Unknown error'}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => this.setState({ hasError: false, error: null })}
                        >
                            Tekrar Dene / Retry
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
} 