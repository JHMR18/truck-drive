import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    scrollRef?: React.RefObject<HTMLElement>;
}

export function PullToRefresh({ onRefresh, children, scrollRef }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0);
    const [pulling, setPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const threshold = 80;

    const getScrollTop = () => {
        if (scrollRef?.current) return scrollRef.current.scrollTop;
        if (containerRef.current?.parentElement) return containerRef.current.parentElement.scrollTop;
        return 0;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (loading) return;
        const scrollTop = getScrollTop();
        if (scrollTop === 0) {
            setStartY(e.touches[0].clientY);
            setPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pulling || loading) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        const scrollTop = getScrollTop();

        if (diff > 0 && scrollTop === 0) {
            // Add resistance
            const damped = Math.min(diff * 0.4, 120);
            setPullDistance(damped);

            // Prevent reloading page on mobile if possible (though passive listener might block this)
            if (e.cancelable) {
                e.preventDefault();
            }
        } else {
            setPulling(false);
            setPullDistance(0);
        }
    };

    const handleTouchEnd = async () => {
        if (!pulling || loading) return;

        if (pullDistance > threshold) {
            setLoading(true);
            setPullDistance(50); // Snap to loading position

            try {
                await onRefresh();
            } finally {
                setLoading(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }

        setPulling(false);
    };

    // Attach non-passive listener to prevent default scroll behavior when pulling
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        // We can't easily prevent default on touchmove in React synthetic events
        // because they are passive by default for scroll performance.
        // However, for PTR, we mostly want the visual feedback.
        // Real "prevention" of browser refresh is hard without standard `overscroll-behavior`.

    }, []);

    return (
        <div
            ref={containerRef}
            className="relative min-h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                transform: `translateY(${pullDistance}px)`,
                transition: pulling ? 'none' : 'transform 0.3s ease-out'
            }}
        >
            {/* Loading Indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none"
                style={{
                    transform: `translateY(-100%)`,
                    height: '50px',
                    opacity: pullDistance > 0 ? 1 : 0
                }}
            >
                <div className={`p-2 rounded-full bg-background shadow-md border ${loading ? 'animate-spin' : ''}`}>
                    {loading ? (
                        <Loader2 className="h-5 w-5 text-primary" />
                    ) : (
                        <div
                            className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full"
                            style={{ transform: `rotate(${pullDistance * 4}deg)` }}
                        />
                    )}
                </div>
            </div>

            {children}
        </div>
    );
}
