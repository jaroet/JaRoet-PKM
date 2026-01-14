(function(J) {
    const { useState, useEffect } = React;
    const { NoteSection } = J;
    const { ContentPreview, SectionContainer } = J.Components;
    const { DB } = J.Services;

    function RightPane({ activeNote, topology, mentions, sortNotes, showContent, prevH, nav, setFSec, ...sp }) {
        // The active tab is determined by the globally focused section. Default to 'right'.
        const activeTab = ['right', 'mentions'].includes(sp.focusedSection) ? sp.focusedSection : 'right';
        const righters = topology?.righters || [];

        return html`
            <div className="flex flex-col gap-3 w-1/4">
                <${SectionContainer}
                    className=${showContent ? 'flex-1' : 'h-full'}
                    tabs=${[
                        { id: 'right', label: 'Siblings', count: righters.length },
                        { id: 'mentions', label: 'Mentions', count: mentions.length }
                    ]}
                    activeTab=${activeTab}
                    onTabChange=${(tabId) => setFSec(tabId)}
                >
                    ${activeTab === 'right' && html`
                        <${NoteSection} notes=${sortNotes(righters)} section="right" containerClasses="flex flex-col gap-0 overflow-y-auto p-3 h-full custom-scrollbar rounded-b-3xl" itemClasses="w-full" containerId="container-right" ...${sp} />
                    `}
                    ${activeTab === 'mentions' && html`
                        <${NoteSection} notes=${sortNotes(mentions)} section="mentions" containerClasses="flex flex-col gap-0 overflow-y-auto p-3 h-full custom-scrollbar rounded-b-3xl" itemClasses="w-full" containerId="container-mentions" ...${sp} />
                    `}
                </${SectionContainer}>
                ${showContent && html`
                    <${ContentPreview} isFocused=${sp.focusedSection === 'content'} fontSize=${sp.fontSize} previewHtml=${prevH} onNavigate=${nav} onFocus=${() => setFSec('content')} />
                `}
            </div>
        `;
    }

    J.Components.RightPane = RightPane;
})(window.Jaroet);