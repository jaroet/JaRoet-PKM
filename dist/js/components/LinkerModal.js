
(function(J) {
    const { useState, useEffect, useRef } = React;
    const { searchNotes } = J.Services.DB;

    J.LinkerModal = ({isOpen, type, onClose, onSelect}) => {
        const [q,setQ]=useState('');const [res,setRes]=useState([]);const [idx,setIdx]=useState(0);const ref=useRef(null);
        useEffect(()=>{if(isOpen){setQ('');setRes([]);setIdx(0);setTimeout(()=>ref.current?.focus(),50);}},[isOpen]);
        useEffect(()=>{const t=setTimeout(async()=>{if(q.trim()&&!q.includes(';'))setRes(await searchNotes(q));else setRes([]);},200);return()=>clearTimeout(t);},[q]);
        const kd=(e)=>{
            if(e.key==='ArrowDown')setIdx(p=>(p+1)%(res.length+1));
            else if(e.key==='ArrowUp')setIdx(p=>(p-1+res.length+1)%(res.length+1));
            else if(e.key==='Enter'){if(q.includes(';')){if(q.trim())onSelect(null,q);}else{if(idx<res.length)onSelect(res[idx].id);else if(q.trim())onSelect(null,q);}onClose();}
            else if(e.key==='Escape')onClose();
        };
        if(!isOpen)return null;
        return html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-96 bg-card p-4 rounded shadow-xl">
                    <h3 className="font-bold mb-2">Link ${type}</h3>
                    <input ref=${ref} className="w-full p-2 border rounded bg-background" value=${q} onChange=${e=>setQ(e.target.value)} onKeyDown=${kd} placeholder="Search or create..." />
                    <div className="mt-2 max-h-60 overflow-y-auto">
                        ${res.map((r,i)=>html`<div key=${r.id} onClick=${()=>{onSelect(r.id);onClose()}} className=${`p-2 cursor-pointer ${i===idx?'bg-primary text-white':''}`}>${r.title}</div>`)}
                        ${q.trim()&&!q.includes(';')&&html`<div onClick=${()=>{onSelect(null,q);onClose()}} className=${`p-2 cursor-pointer ${idx===res.length?'bg-primary text-white':''}`}>+ Create "${q}"</div>`}
                    </div>
                </div>
            </div>
        `;
    };
})(window.Jaroet);
