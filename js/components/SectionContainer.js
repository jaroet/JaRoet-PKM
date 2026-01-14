(function(J) {
    const { html } = window;

    J.Components.SectionContainer = ({ 
        title, 
        count, 
        tabs, 
        activeTab, 
        onTabChange, 
        children, 
        className, 
        headerClasses = "border-b border-gray-200 dark:border-gray-800 px-2 flex-shrink-0",
        contentClasses = "flex-1 min-h-0 relative",
        ...props
    }) => {
        
        const renderTab = (tId, tLabel, tCount, isActive, onClick) => {
            return html`
                <button 
                    key=${tId}
                    onClick=${onClick}
                    className=${`px-3 py-1 text-sm font-medium rounded-t-md border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} ${!onClick ? 'cursor-default' : ''}`}
                >
                    ${tLabel} ${tCount !== undefined ? `(${tCount})` : ''}
                </button>
            `;
        };

        return html`
            <div className=${`relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0 flex flex-col ${className || ''}`} ...${props}>
                <div className=${`flex ${headerClasses}`}>
                    ${tabs ? tabs.map(t => renderTab(t.id, t.label, t.count, activeTab === t.id, () => onTabChange(t.id))) 
                           : renderTab('single', title, count, true, null)}
                </div>
                <div className=${contentClasses}>
                    ${children}
                </div>
            </div>
        `;
    };
})(window.Jaroet);