
(function(J) {
    const { getVaultList, getCurrentVaultName, switchVault } = J.Services.DB;
    const { Icons } = J;

    J.VaultChooser = ({ isOpen, onClose, onManage }) => {
        if (!isOpen) return null;

        const vaults = getVaultList();
        const current = getCurrentVaultName();

        return html`
            <div className="fixed inset-0 z-50" onClick=${onClose}>
                <div 
                    className="absolute bottom-10 left-4 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 flex flex-col py-1 animate-in fade-in slide-in-from-bottom-2 duration-100"
                    onClick=${e => e.stopPropagation()}
                >
                    <button onClick=${onManage} className="w-full px-3 py-2 hover:bg-primary/10 flex items-center gap-2 text-sm font-semibold text-primary border-b border-gray-100 dark:border-gray-800">
                        <${Icons.Settings} width="16" height="16" />
                        <span>Manage Vaults...</span>
                    </button>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        ${vaults.map(v => html`<div key=${v} onClick=${() => switchVault(v)} className=${`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm truncate ${v === current ? 'text-primary font-bold' : ''}`}>${v}</div>`)}
                    </div>
                </div>
            </div>
        `;
    };
})(window.Jaroet);