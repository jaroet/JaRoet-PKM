
(function(J) {
    const { useState, useEffect, useRef } = React;
    const { searchNotes } = J.Services.DB;
    const { getNote } = J.Services.DB;
    J.LinkerModal = ({isOpen, type, onClose, onSelect, sourceNoteId}) => {
        const [q,setQ]=useState('');const [res,setRes]=useState([]);const [idx,setIdx]=useState(0);const ref=useRef(null);
        const [sourceTitle, setSourceTitle] = useState('');

        useEffect(()=>{if(isOpen){setQ('');setRes([]);setIdx(0);setTimeout(()=>ref.current?.focus(),50);}},[isOpen, sourceNoteId]);
        useEffect(()=>{const t=setTimeout(async()=>{if(q.trim()&&!q.includes(';'))setRes(await searchNotes(q));else setRes([]);},200);return()=>clearTimeout(t);},[q]);
        
        useEffect(() => {
            if (isOpen && sourceNoteId) {
                getNote(sourceNoteId).then(note => note && setSourceTitle(note.title));
            } else if (!isOpen) {
                setSourceTitle(''); // Reset when closed
            }
        }, [isOpen, sourceNoteId]);

        const kd=(e)=>{
            if(e.key==='ArrowDown')setIdx(p=>(p+1)%(res.length+1));
            else if(e.key==='ArrowUp')setIdx(p=>(p-1+res.length+1)%(res.length+1));
            else if(e.key==='Enter'){if(q.includes(';')){if(q.trim())onSelect(null,q);}else{if(idx<res.length)onSelect(res[idx].id);else if(q.trim())onSelect(null,q);}onClose();}
            else if(e.key==='Escape')onClose();
        };

        let createTitle = q;
        if (q.startsWith(', ') && sourceTitle) {
            createTitle = `${sourceTitle} ${q.substring(2)}`;
        }

        return html`
            ${!isOpen ? null : html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-96 bg-card p-4 rounded shadow-xl">
                    <h3 className="font-bold mb-2">Link ${type}</h3>
                    <input ref=${ref} className="w-full p-2 border rounded bg-background" value=${q} onChange=${e=>setQ(e.target.value)} onKeyDown=${kd} placeholder="Search or create..." />
                    <div className="mt-2 max-h-60 overflow-y-auto">
                        ${res.map((r,i)=>html`<div key=${r.id} onClick=${()=>{onSelect(r.id);onClose()}} className=${`p-2 cursor-pointer ${i===idx?'bg-primary text-primary-foreground':''}`}>${r.title}</div>`)}
                        ${q.trim()&&!q.includes(';')&&html`<div onClick=${()=>{onSelect(null,q);onClose()}} className=${`p-2 cursor-pointer ${idx===res.length?'bg-primary text-primary-foreground':''}`}>+ Create "${createTitle}"</div>`}
                    </div>
                </div>
            </div>
            `}
        `;
    };
})(window.Jaroet);
