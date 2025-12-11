
(function(J) {
    J.ImportModal = ({isOpen, onClose, importData, onConfirm}) => {
        if(!isOpen)return null;
        return html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-96 bg-card p-6 rounded shadow-xl">
                    <h3 className="font-bold mb-4">Import ${importData.length} Notes</h3>
                    <button onClick=${()=>onConfirm('merge')} className="block w-full mb-2 bg-blue-600 text-white p-2 rounded">Merge</button>
                    <button onClick=${()=>onConfirm('overwrite')} className="block w-full mb-2 bg-red-600 text-white p-2 rounded">Overwrite</button>
                    <button onClick=${onClose} className="block w-full text-center text-gray-500">Cancel</button>
                </div>
            </div>
        `;
    };
})(window.Jaroet);
