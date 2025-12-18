(function(J) {
    const { useState, useEffect, useRef, useCallback } = React;

    /**
     * Custom hook to manage keyboard navigation and scrolling for a list.
     *
     * @param {boolean} isOpen - Whether the list is visible.
     * @param {number} itemCount - The number of items in the list.
     * @param {function} onEnter - Callback when Enter is pressed on an item.
     * @param {function} onEscape - Callback when Escape is pressed.
     * @returns {object} An object containing the active index and refs.
     */
    J.Hooks.useListNavigation = ({ isOpen, itemCount, onEnter, onEscape }) => {
        const [activeIndex, setActiveIndex] = useState(0);
        const listRef = useRef(null); // Ref for the container to scroll

        // Reset index when list opens or item count changes
        useEffect(() => {
            if (isOpen) {
                setActiveIndex(0);
            }
        }, [isOpen, itemCount]);

        // Scroll active item into view
        useEffect(() => {
            if (isOpen && listRef.current && listRef.current.children[activeIndex]) {
                listRef.current.children[activeIndex].scrollIntoView({ block: 'nearest' });
            }
        }, [activeIndex, isOpen]);

        const handleKeyDown = useCallback((e) => {
            if (!isOpen || itemCount === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(p => (p + 1) % itemCount);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(p => (p - 1 + itemCount) % itemCount);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                onEnter(activeIndex);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onEscape();
            }
        }, [isOpen, itemCount, activeIndex, onEnter, onEscape]);

        return { activeIndex, setActiveIndex, listRef, handleKeyDown };
    };
})(window.Jaroet);