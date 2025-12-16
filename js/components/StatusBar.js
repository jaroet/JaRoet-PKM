
(function(J) {
    J.StatusBar = ({ noteCount, vaultName, version, fontSize, onVaultClick }) => {
        return html`
            <div 
                style=${{ fontSize: `${Math.max(12, fontSize - 2)}px` }} 
                className="h-8 flex-shrink-0 app-bar border-t flex items-center justify-between px-4 text-foreground z-50 select-none transition-colors duration-300"
            >
                <div className="flex-shrink-0 opacity-90 flex items-center gap-1">
                    <span>Notes: <b>${noteCount}</b></span>
                    <span className="mx-2 opacity-50">|</span>
                    <button onClick=${onVaultClick} className="font-semibold text-primary truncate max-w-[150px] hover:underline">${vaultName}</button>
                    <span className="mx-2 opacity-50">|</span>
                    <a href="https://github.com/jaroet/JaRoet-PKM/releases" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 hover:text-primary hover:underline transition-all">
                        v${version}
                    </a>
                </div>
                <div className="opacity-50 truncate ml-4 text-right hidden sm:block">
                    <span className="mr-2">Arrows: Nav</span>
                    <span className="mr-2">Space: Open</span>
                    <span className="mr-2">Enter: Center</span>
                    <span className="mr-2">Shift+Enter: Edit</span>
                    <span>/: Search</span>
                </div>
            </div>
        `;
    };
})(window.Jaroet);
