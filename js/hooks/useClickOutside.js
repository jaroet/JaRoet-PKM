(function(J) {
    const { useEffect, useRef } = React;

    /**
     * Custom hook to detect clicks outside of a specified element.
     * When an outside click occurs and the component is open, it triggers the onClose callback.
     *
     * @param {boolean} isOpen - Boolean indicating if the component (dropdown/modal) is currently open.
     * @param {function} onClose - Callback function to be executed when an outside click is detected.
     * @returns {React.RefObject<HTMLElement>} A ref to be attached to the root element of the component.
     */
    J.Hooks.useClickOutside = (isOpen, onClose) => {
        const ref = useRef(null);

        useEffect(() => {
            if (!isOpen) return;

            const handleClickOutside = (event) => {
                if (ref.current && !ref.current.contains(event.target)) {
                    onClose();
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen, onClose]);

        return ref;
    };
})(window.Jaroet);