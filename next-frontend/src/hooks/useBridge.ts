// Path: NextFrontend/src/hooks/useBridge.ts
'use client';

import { useState, useCallback } from 'react';
import { invoke } from '@/lib/bridge';

/**
 * React hook that wraps a bridge call with loading/error state management.
 *
 * Usage:
 *   const { execute, data, loading, error } = useBridge<Employee[]>();
 *   useEffect(() => { execute('getEmployees', { activeOnly: true }); }, []);
 */
export function useBridge<T = any>() {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(
        async (command: string, payload: Record<string, any> = {}) => {
            setLoading(true);
            setError(null);
            try {
                const result = await invoke<T>(command, payload);
                setData(result);
                return result;
            } catch (err: any) {
                const msg = err?.message ?? 'Unknown error';
                setError(msg);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { execute, data, loading, error, reset };
} 