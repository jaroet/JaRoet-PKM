
(function(J) {
    const { useState, useEffect, useRef } = React;
    J.RenameModal = ({isOpen, currentTitle, onClose, onRename}) => {
        const [t,setT]=useState(currentTitle);const ref=useRef(null);
        useEffect(()=>{if(isOpen){setT(currentTitle);setTimeout(()=>ref.current?.focus(),50);}},[isOpen,currentTitle]);
        if(!isOpen)return null;
        return html`<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-card p-6 rounded-xl shadow-2xl w-full max-w-md"><h3 className="text-lg font-bold mb-4">Rename</h3><form onSubmit=${e=>{e.preventDefault();if(t.trim()){onRename(t.trim());onClose();}}}><input ref=${ref} value=${t} onChange=${e=>setT(e.target.value)} className="w-full p-2 border rounded bg-background mb-4"/><div className="flex justify-end gap-2"><button type="button" onClick=${onClose}>Cancel</button><button type="submit" className="bg-primary text-white px-4 py-2 rounded">Rename</button></div></form></div></div>`;
    };
})(window.Jaroet);
