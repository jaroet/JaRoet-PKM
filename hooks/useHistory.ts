
import { useState, useCallback } from 'react';

const MAX_HISTORY = 50;

interface UseHistoryResult {
    currentId: string | null;
    visit: (id: string) => void;
    replace: (id: string) => void;
    back: () => void;
    forward: () => void;
    canBack: boolean;
    canForward: boolean;
    history: string[]; // Exposed for debug if needed
}

export function useHistory(initialId: string | null = null): UseHistoryResult {
    // History stack
    const [history, setHistory] = useState<string[]>(initialId ? [initialId] : []);
    // Pointer to current position in history
    const [index, setIndex] = useState<number>(initialId ? 0 : -1);

    const currentId = index >= 0 && index < history.length ? history[index] : null;

    const visit = useCallback((id: string) => {
        setHistory(prev => {
            // If we are navigating to the same note, do nothing (optional, but good for UX)
            if (prev[index] === id) return prev;

            // 1. Slice history up to current index (remove forward history)
            const newHistory = prev.slice(0, index + 1);
            
            // 2. Push new ID
            newHistory.push(id);

            // 3. Apply Limit (remove from start if too long)
            if (newHistory.length > MAX_HISTORY) {
                newHistory.shift();
            }
            
            return newHistory;
        });

        setIndex(prev => {
            // If we are at the limit, the index stays at max-1, otherwise increment
            // We need to calculate based on the *new* length logic
            // But state updates are async/batched. 
            // Simplified: If we were at max, we shifted, so index stays same relative to end? 
            // Actually, simply:
            // If length was < MAX, index increases.
            // If length was = MAX, we shift 1, push 1, length stays MAX, index stays MAX-1.
            
            // However, we don't have access to the *new* history length here easily without complexity.
            // Let's rely on the setter function.
            
            // To be safe and avoid race conditions with the history slice above, 
            // we can just clamp it in the next render or use a ref, 
            // but let's assume the standard case:
            const estimatedLength = index + 2; // +1 for slice inclusion, +1 for push
            if (estimatedLength > MAX_HISTORY) {
                return MAX_HISTORY - 1;
            }
            return index + 1;
        });
    }, [index]);

    const replace = useCallback((id: string) => {
        setHistory([id]);
        setIndex(0);
    }, []);

    const back = useCallback(() => {
        if (index > 0) {
            setIndex(prev => prev - 1);
        }
    }, [index]);

    const forward = useCallback(() => {
        if (index < history.length - 1) {
            setIndex(prev => prev + 1);
        }
    }, [index, history.length]);

    return {
        currentId,
        visit,
        replace,
        back,
        forward,
        canBack: index > 0,
        canForward: index < history.length - 1,
        history
    };
}
