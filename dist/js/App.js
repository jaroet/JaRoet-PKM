
(function(J) {
    const { useState, useEffect, useRef, useCallback } = React;
    const { db, getTopology, createNote, updateNote, deleteNote, getFavorites, toggleFavorite, seedDatabase, getNote, getAllNotes, importNotes, getHomeNoteId, searchNotes, getFontSize, getNoteCount, getVaultList, getCurrentVaultName, switchVault, getAppTheme, getSectionVisibility, findNoteByTitle, getNoteTitlesByPrefix, APP_VERSION } = J.Services.DB;
    const { goToDate, goToToday, getDateSubtitle } = J.Services.Journal;
    const { createRenderer, wikiLinkExtension } = J.Services.Markdown;
    const { NoteCard, LinkerModal, Editor, CalendarDropdown, SettingsModal, ImportModal, RenameModal, Icons, NoteSection } = J;
    const { useHistory } = J.Hooks;

    marked.use({renderer:createRenderer({clickableCheckboxes:false}),extensions:[wikiLinkExtension]});

    J.App = () => {
        // --- State ---
        const {currentId,visit,replace,back,forward,canBack,canForward}=useHistory();
        const [topo,setTopo]=useState({center:null,uppers:[],downers:[],lefters:[],righters:[]}),[favs,setFavs]=useState([]),[dark,setDark]=useState(true),[fs,setFs]=useState(16),[vis,setVis]=useState({showFavorites:true,showContent:true}),[count,setCount]=useState(0);
        
        // Navigation State
        const [fSec,setFSec]=useState('center'),[fIdx,setFIdx]=useState(0),[sel,setSel]=useState(new Set());
        const [secInd,setSecInd]=useState({up:0,down:0,left:0,right:0,favs:0});
        const scrollRef=useRef({});
        
        // Refs for Event Listeners
        const selRef=useRef(new Set());
        const fSecRef=useRef('center');
        const fIdxRef=useRef(0);
        const topoRef=useRef({center:null,uppers:[],downers:[],lefters:[],righters:[]});
        const favsRef=useRef([]);
        const visRef=useRef({showFavorites:true,showContent:true});
        const secIndRef=useRef({up:0,down:0,left:0,right:0,favs:0});

        // UI State
        const [menu,setMenu]=useState(false),[favDrop,setFavDrop]=useState(false),[vaultMenu,setVaultMenu]=useState(false),[cal,setCal]=useState(false),[calD,setCalD]=useState(new Set());
        const [search,setSearch]=useState(''),[sRes,setSRes]=useState([]),[sIdx,setSIdx]=useState(0),[sAct,setSAct]=useState(false);
        const [ed,setEd]=useState(false),[edMode,setEdMode]=useState('view'),[lnk,setLnk]=useState(false),[lnkType,setLnkType]=useState('up'),[ren,setRen]=useState(false),[renN,setRenN]=useState(null),[sett,setSett]=useState(false),[imp,setImp]=useState(false),[impD,setImpD]=useState([]);
        const [prevH,setPrevH]=useState('');
        const searchInputRef=useRef(null);

        // --- Effects & Sync ---
        useEffect(()=>{seedDatabase().then(id=>{db.meta.get('currentCentralNoteId').then(v=>replace(v?v.value:id));getFontSize().then(setFs);getSectionVisibility().then(setVis);getFavorites().then(setFavs);getNoteCount().then(setCount);});},[]);
        useEffect(()=>{document.documentElement.classList.toggle('dark',dark);},[dark]);
        useEffect(()=>{
            getAppTheme().then(t=>{
                const c=dark?t.dark:t.light;
                document.documentElement.style.setProperty('--background',c.background);
                document.documentElement.style.setProperty('--card',c.section);
                document.documentElement.style.setProperty('--primary',c.accent);
                document.documentElement.style.setProperty('--card-foreground', dark ? '#f8fafc' : '#0f172a');
            });
        },[dark, count]);

        useEffect(()=>{
            if(currentId){
                getTopology(currentId).then(setTopo);
                db.meta.put({key:'currentCentralNoteId',value:currentId});
                setFSec('center');setFIdx(0);setSel(new Set());scrollRef.current={};
                setSecInd({up:0,down:0,left:0,right:0,favs:0});
                getNoteCount().then(setCount);
            }
        },[currentId]);

        // Sync Refs
        useEffect(()=>{selRef.current=sel},[sel]);
        useEffect(()=>{fSecRef.current=fSec},[fSec]);
        useEffect(()=>{fIdxRef.current=fIdx},[fIdx]);
        useEffect(()=>{topoRef.current=topo},[topo]);
        useEffect(()=>{favsRef.current=favs},[favs]);
        useEffect(()=>{visRef.current=vis},[vis]);
        useEffect(()=>{secIndRef.current=secInd},[secInd]);

        // Helper: Get Sorted Notes
        const getSortedNotes = (sec, t=topo, f=favs) => {
            if(sec==='center')return t.center?[t.center]:[];
            let n=[]; if(sec==='up')n=t.uppers;else if(sec==='down')n=t.downers;else if(sec==='left')n=t.lefters;else if(sec==='right')n=t.righters;else if(sec==='favs')n=f;
            return [...n].sort((a,b)=>a.title.localeCompare(b.title));
        };

        const getFocusedNote = () => {
            if(fSec==='content'||fSec==='center') return topo.center;
            return getSortedNotes(fSec,topo,favs)[fIdx] || null;
        };

        useEffect(()=>{
            const n=getFocusedNote();
            if(n&&n.content){setPrevH(marked.parse(n.content));}else{setPrevH('<p class="opacity-50">No content</p>');}
        },[fSec,fIdx,topo,favs]);

        // Remember indices
        useEffect(()=>{if(fSec!=='center'&&fSec!=='content')setSecInd(p=>({...p,[fSec]:fIdx}));},[fIdx,fSec]);

        // Scroll Into View
        useEffect(()=>{
            if(fSec!=='center'&&fSec!=='content'){
                const el=document.getElementById(`note-${fSec}-${fIdx}`);
                if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});
            }
        },[fSec,fIdx]);

        // Actions
        const nav=(id)=>visit(id);
        const togSel=(id)=>id!==currentId&&setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
        
        const handleLink = async (tid, t) => {
            const focusedNote = getFocusedNote();
            const aid = focusedNote ? focusedNote.id : currentId;
            if(!aid)return;
            
            const doL = async (id) => {
                const center = await getNote(aid); const target = await getNote(id);
                // Unlink
                if(center.linksTo.includes(id)) await updateNote(aid,{linksTo:center.linksTo.filter(x=>x!==id)});
                if(target.linksTo.includes(aid)) await updateNote(id,{linksTo:target.linksTo.filter(x=>x!==aid)});
                if(center.relatedTo.includes(id)) await updateNote(aid,{relatedTo:center.relatedTo.filter(x=>x!==id)});
                if(target.relatedTo.includes(aid)) await updateNote(id,{relatedTo:target.relatedTo.filter(x=>x!==aid)});
                
                // Link
                if(lnkType==='up'){ const trg=await getNote(id); await updateNote(id,{linksTo:[...trg.linksTo,aid]}); }
                else if(lnkType==='down'){ const anc=await getNote(aid); await updateNote(aid,{linksTo:[...anc.linksTo,id]}); }
                else { const anc=await getNote(aid); await updateNote(aid,{relatedTo:[...anc.relatedTo,id]}); const trg=await getNote(id); await updateNote(id,{relatedTo:[...trg.relatedTo,aid]}); }
            };

            if(!tid&&t){ if(t.includes(';')){ for(const tt of t.split(';').map(x=>x.trim()).filter(Boolean)){ const n=await createNote(tt); await doL(n.id); } } else { const n=await createNote(t); await doL(n.id); } } 
            else if(tid) await doL(tid);
            
            if(currentId) getTopology(currentId).then(setTopo);
            getNoteCount().then(setCount);
        };

        const changeRelationship = async (type) => {
            const targets = sel.size > 0 ? Array.from(sel) : (getFocusedNote() ? [getFocusedNote().id] : []);
            if(!targets.length || !currentId) return;
            const valid = targets.filter(id=>id!==currentId);
            
            for(const id of valid) {
                const c = await getNote(currentId); const t = await getNote(id);
                if(c.linksTo.includes(id)) await updateNote(currentId,{linksTo:c.linksTo.filter(x=>x!==id)});
                if(t.linksTo.includes(currentId)) await updateNote(id,{linksTo:t.linksTo.filter(x=>x!==currentId)});
                if(c.relatedTo.includes(id)) await updateNote(currentId,{relatedTo:c.relatedTo.filter(x=>x!==id)});
                if(t.relatedTo.includes(currentId)) await updateNote(id,{relatedTo:t.relatedTo.filter(x=>x!==currentId)});
                
                if(type==='up') { const t2=await getNote(id); await updateNote(id,{linksTo:[...t2.linksTo,currentId]}); }
                else if(type==='down') { const c2=await getNote(currentId); await updateNote(currentId,{linksTo:[...c2.linksTo,id]}); }
                else if(type==='left') { const c2=await getNote(currentId); await updateNote(currentId,{relatedTo:[...c2.relatedTo,id]}); const t2=await getNote(id); await updateNote(id,{relatedTo:[...t2.relatedTo,currentId]}); }
            }
            getTopology(currentId).then(setTopo); setSel(new Set());
        };

        const handleLinkAction = (type) => {
            if(sel.size > 0) {
                changeRelationship(type);
            } else {
                setLnkType(type);
                setLnk(true);
            }
        };

        const handleFavToggle = async () => {
            const n = getFocusedNote();
            if (n) {
                await toggleFavorite(n.id);
                setCount(c => c + 1);
                getTopology(currentId).then(setTopo);
                getFavorites().then(setFavs);
            }
        };

        const getItemsPerColumn = (id) => {
            const el = document.getElementById(id); if(!el) return 1;
            const kids = Array.from(el.children).filter(c=>c.id.startsWith('note-'));
            if(kids.length < 2) return 1;
            const firstLeft = kids[0].offsetLeft;
            for(let i=1; i<kids.length; i++) if(kids[i].offsetLeft > firstLeft + 20) return i;
            return kids.length;
        };

        const doSearch=async(q)=>{setSearch(q);if(q){setSRes(await searchNotes(q));setSIdx(0);}else setSRes([]);};

        const exportData = async () => {
            const notes = await getAllNotes();
            const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            a.download = `JaRoetPKM_${getCurrentVaultName()}_${dateStr}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        // --- KEYBOARD HANDLER (Robust Ref Pattern) ---
        const handleGlobalKeyDown = useCallback(async (e) => {
            // Refs for state access
            const selState = selRef.current;
            const fSecState = fSecRef.current;
            const fIdxState = fIdxRef.current;
            const topoState = topoRef.current;
            const favsState = favsRef.current;
            const visState = visRef.current;
            const secIndState = secIndRef.current;

            // Blockers
            if (ren||ed||lnk||sett||imp||menu||cal||favDrop) {
                if (e.key === 'Escape') {
                    if(menu) setMenu(false); if(cal) setCal(false); if(favDrop) setFavDrop(false);
                }
                return; 
            }
            if (sAct) {
                if (e.key==='Escape') { setSAct(false); e.preventDefault(); return; }
                if (e.key==='ArrowDown') { e.preventDefault(); setSIdx(p=>(p+1)%sRes.length); return; }
                if (e.key==='ArrowUp') { e.preventDefault(); setSIdx(p=>(p-1+sRes.length)%sRes.length); return; }
                if (e.key==='Enter') { e.preventDefault(); if(sRes[sIdx]) { nav(sRes[sIdx].id); setSAct(false); setSearch(''); } return; }
                return;
            }

            // General Escape
            if (e.key === 'Escape') {
                if (selState.size > 0) { setSel(new Set()); e.preventDefault(); return; }
            }

            // History
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); back(); return; }
            if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); forward(); return; }

            // Search Trigger
            if (e.key === '/') { e.preventDefault(); setSAct(true); setTimeout(()=>searchInputRef.current?.focus(), 50); return; }

            // Journal
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); nav(await goToToday()); return; }

            // Selection (x)
            if (e.key === 'x') {
                e.preventDefault();
                const note = (fSecState==='center'||fSecState==='content') ? topoState.center : getSortedNotes(fSecState, topoState, favsState)[fIdxState];
                if (note && note.id !== currentId) {
                    togSel(note.id);
                    // Move Next
                    const list = getSortedNotes(fSecState, topoState, favsState);
                    if (fIdxState < list.length - 1) setFIdx(p=>p+1);
                }
                return;
            }

            // Deletion
            if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
                e.preventDefault();
                const targets = selState.size > 0 ? Array.from(selState) : (getFocusedNote() ? [getFocusedNote().id] : []);
                if (targets.length && confirm(`Delete ${targets.length}?`)) {
                    for (const id of targets) await deleteNote(id);
                    if (targets.includes(currentId)) nav(await getHomeNoteId() || (await getAllNotes())[0].id);
                    else { getTopology(currentId).then(setTopo); getNoteCount().then(setCount); }
                    setSel(new Set());
                }
                return;
            }

            // Unlink
            if (e.key === 'Backspace') {
                e.preventDefault();
                changeRelationship('unlink');
                return;
            }

            // Linking
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === 'ArrowUp') { e.preventDefault(); if(selState.size) changeRelationship('up'); else { setLnkType('up'); setLnk(true); } return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); if(selState.size) changeRelationship('down'); else { setLnkType('down'); setLnk(true); } return; }
                if (e.key === 'ArrowLeft') { e.preventDefault(); if(selState.size) changeRelationship('left'); else { setLnkType('left'); setLnk(true); } return; }
                // Editor
                if (e.key === 'Enter') { e.preventDefault(); setEdMode('edit'); setEd(true); return; }
            }

            // Preview
            if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); setEdMode('view'); setEd(true); return; }

            // Rename
            if (e.key === 'F2') { e.preventDefault(); const n = getFocusedNote(); if(n) { setRenN(n); setRen(true); } return; }

            // Nav - Enter/Space
            if (e.key === 'Enter') { e.preventDefault(); setFSec('center'); return; }
            if (e.key === ' ') { e.preventDefault(); const n = getFocusedNote(); if(n && n.id !== currentId) nav(n.id); return; }

            // --- ARROW NAVIGATION ---
            
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if(fSecState==='center'){ if(topoState.uppers.length){ setFSec('up'); setFIdx(Math.min(secIndState.up, topoState.uppers.length-1)); } }
                else if(fSecState==='content'){ setFSec('right'); setFIdx(Math.min(secIndState.right, topoState.righters.length-1)); }
                else if(fSecState==='down'){ if(fIdxState===0) setFSec('center'); else setFIdx(p=>p-1); }
                else if(fSecState==='favs'){ if(fIdxState===0){ setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); } else setFIdx(p=>p-1); }
                else setFIdx(p=>Math.max(0,p-1));
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const list = getSortedNotes(fSecState, topoState, favsState);
                if(fSecState==='center'){ if(topoState.downers.length){ setFSec('down'); setFIdx(Math.min(secIndState.down, topoState.downers.length-1)); } }
                else if(fSecState==='content') return;
                else if(fSecState==='up'){ if(fIdxState===list.length-1) setFSec('center'); else setFIdx(p=>p+1); }
                else if(fSecState==='left'){ if(fIdxState===list.length-1){ if(visState.showFavorites&&favsState.length){ setFSec('favs'); setFIdx(Math.min(secIndState.favs, favsState.length-1)); } } else setFIdx(p=>p+1); }
                else if(fSecState==='right'){ if(fIdxState===list.length-1){ if(visState.showContent){ setFSec('content'); } } else setFIdx(p=>p+1); }
                else setFIdx(p=>Math.min(list.length-1,p+1));
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if(['up','down','left','right','favs'].includes(fSecState)){
                    const cols = getItemsPerColumn(`container-${fSecState}`);
                    if(fIdxState - cols >= 0){ setFIdx(p=>p-cols); return; }
                }
                if(fSecState==='content'){ setFSec('down'); setFIdx(Math.min(secIndState.down, topoState.downers.length-1)); }
                else if(fSecState==='center'){ if(topoState.lefters.length){ setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); } else if(visState.showFavorites&&favsState.length){ setFSec('favs'); setFIdx(0); } }
                else if(fSecState==='right'){ setFSec('up'); setFIdx(Math.min(secIndState.up, topoState.uppers.length-1)); }
                else if(fSecState==='down'){ if(visState.showFavorites&&favsState.length){ setFSec('favs'); setFIdx(Math.min(secIndState.favs, favsState.length-1)); } else { setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); } }
                else if(fSecState==='up'){ setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); }
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if(['up','down','left','right','favs'].includes(fSecState)){
                    const cols = getItemsPerColumn(`container-${fSecState}`);
                    const list = getSortedNotes(fSecState, topoState, favsState);
                    if(fIdxState + cols < list.length){ setFIdx(p=>p+cols); return; }
                }
                if(fSecState==='content') return;
                if(fSecState==='center'){ if(topo.righters.length){ setFSec('right'); setFIdx(Math.min(secIndState.right, topo.righters.length-1)); } else if(vis.showContent) setFSec('content'); }
                else if(fSecState==='left'){ setFSec('up'); setFIdx(Math.min(secIndState.up, topo.uppers.length-1)); }
                else if(fSecState==='favs'){ setFSec('down'); setFIdx(Math.min(secIndState.down, topo.downers.length-1)); }
                else if(fSecState==='up'){ setFSec('right'); setFIdx(Math.min(secIndState.right, topo.righters.length-1)); }
                else if(fSecState==='down'){ if(vis.showContent){ setFSec('content'); } else if(topo.righters.length){ setFSec('right'); setFIdx(Math.min(secIndState.right, topo.righters.length-1)); } }
            }

        }, [currentId, back, forward, sRes, sIdx, sAct, ren, ed, lnk, sett, imp, menu, cal, favDrop]);

        // Robust Listener Attachment
        const handleKeyDownRef = useRef(handleGlobalKeyDown);
        useEffect(() => { handleKeyDownRef.current = handleGlobalKeyDown; }, [handleGlobalKeyDown]);
        useEffect(() => {
            const handler = (e) => handleKeyDownRef.current(e);
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
        }, []);

        const subT=topo.center?getDateSubtitle(topo.center.title):null;
        const sp={fontSize:fs,focusedSection:fSec,focusedIndex:fIdx,selectedNoteIds:sel,centralNoteId:currentId,onNoteClick:(id,c)=>c?togSel(id):id!==currentId&&nav(id),scrollPositionsRef:scrollRef};
        
        const activeNote = getFocusedNote();
        const activeHasContent = activeNote && activeNote.content && activeNote.content.trim().length > 0;
        
        const labelStyle = "absolute -top-[5px] left-6 px-3 py-0.5 font-bold tracking-wider bg-card text-primary select-none z-20 pointer-events-none rounded-full border border-black/10 dark:border-white/10 text-xs";

        // Logic for enabling Unlink: Enabled if Multi-selected OR if single-focused on a linkable section (up/down/left)
        const canUnlink = sel.size > 0 || ['up', 'down', 'left'].includes(fSec);

        return html`
            <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
                <div className="flex-1 flex flex-col h-full min-w-0">
                    <!-- Top Bar -->
                    <div style=${{fontSize:`${Math.max(12,fs-4)}px`}} className="h-12 flex-shrink-0 flex items-center px-2 gap-1 z-40 shadow-md relative bg-card text-foreground transition-colors duration-300">
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <button onClick=${()=>setMenu(!menu)} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary">
                                    <${Icons.Menu} />
                                </button>
                                ${menu&&html`
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 flex flex-col py-2">
                                        <div className="border-b border-gray-100 dark:border-gray-800 mb-1 pb-1">
                                            <button onClick=${()=>setVaultMenu(!vaultMenu)} className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between">
                                                <div className="flex items-center gap-2"><${Icons.Vault} width="16" height="16" /><span>Vault: <b>${getCurrentVaultName()}</b></span></div>
                                                <span>▼</span>
                                            </button>
                                            ${vaultMenu&&html`<div className="bg-gray-50 dark:bg-zinc-900 border-y border-gray-100 dark:border-gray-800">${getVaultList().map(v=>html`<div key=${v} onClick=${()=>{switchVault(v)}} className=${`px-8 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer text-sm ${v===getCurrentVaultName()?'text-primary font-bold':''}`}>${v}</div>`)}</div>`}
                                        </div>
                                        <button onClick=${()=>{setDark(!dark);setMenu(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center"><${dark?Icons.Sun:Icons.Moon} width="16" height="16" /><span className="text-primary">Theme</span></button>
                                        <button onClick=${()=>{setSett(true);setMenu(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center"><${Icons.Settings} width="16" height="16" /><span className="text-primary">Settings</span></button>
                                        <button onClick=${()=>{exportData();setMenu(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center"><${Icons.Download} width="16" height="16" />Export</button>
                                        <button onClick=${()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>{setImpD(JSON.parse(ev.target.result));setImp(true);};r.readAsText(f);}};i.click();setMenu(false);}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex gap-2 items-center"><${Icons.Upload} width="16" height="16" />Import</button>
                                    </div>
                                `}
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                            <button onClick=${back} disabled=${!canBack} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 text-primary"><${Icons.ChevronLeft} /></button>
                            <button onClick=${forward} disabled=${!canForward} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 text-primary"><${Icons.ChevronRight} /></button>
                        </div>

                        <button onClick=${async()=>{nav(await getHomeNoteId())}} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.Home} /></button>

                        <div className="relative">
                            <button onClick=${()=>setCal(!cal)} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.Calendar} /></button>
                            <${CalendarDropdown} isOpen=${cal} onClose=${()=>setCal(false)} onSelectDate=${async(d)=>{setCal(false);nav(await goToDate(d))}} existingDates=${calD} onMonthChange=${async(y,m)=>{const p=`${y}-${String(m).padStart(2,'0')}-`;setCalD(new Set(await getNoteTitlesByPrefix(p)))}} />
                        </div>

                        <div className="relative">
                            <button onClick=${()=>setFavDrop(!favDrop)} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.FavList} /></button>
                            ${favDrop&&html`<div className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto">${favs.map(f=>html`<div key=${f.id} onClick=${()=>{nav(f.id);setFavDrop(false)}} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm truncate">${f.title}</div>`)}</div>`}
                        </div>

                        <div className="h-6 w-px bg-current opacity-20 mx-0.5"></div>

                        <div className="flex items-center gap-1">
                            <button onClick=${handleFavToggle} className=${`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${activeNote?.isFavorite?'text-primary':'text-gray-400'}`}><${Icons.Star} fill=${activeNote?.isFavorite?"currentColor":"none"} /></button>
                            <button onClick=${()=>setEd(true)} className=${`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${activeHasContent?'text-primary':'text-gray-400'}`}><${Icons.Edit} fill=${activeHasContent?"currentColor":"none"} /></button>
                            <button onClick=${()=>{if(activeNote){setRenN(activeNote);setRen(true)}}} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.Rename} /></button>
                            <button onClick=${async()=>{if(activeNote&&confirm('Delete?')){await deleteNote(activeNote.id);nav(currentId===activeNote.id?await getHomeNoteId():currentId);}}} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.Trash} /></button>
                        </div>

                        <div className="h-6 w-px bg-current opacity-20 mx-0.5"></div>

                        <div className="flex items-center gap-1">
                            <button onClick=${()=>changeRelationship('unlink')} disabled=${!canUnlink} className=${`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary ${!canUnlink?'opacity-30':''}`}><${Icons.Unlink} /></button>
                            <button onClick=${()=>handleLinkAction('left')} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.LinkLeft} /></button>
                            <button onClick=${()=>handleLinkAction('up')} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.LinkUp} /></button>
                            <button onClick=${()=>handleLinkAction('down')} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-primary"><${Icons.LinkDown} /></button>
                        </div>

                        <div className="h-6 w-px bg-current opacity-20 mx-0.5"></div>

                        <div className="relative flex-1">
                            <input ref=${searchInputRef} value=${search} onChange=${e=>doSearch(e.target.value)} onFocus=${()=>setSAct(true)} onKeyDown=${e=>{if(e.key==='Enter'&&sRes[sIdx]){nav(sRes[sIdx].id);setSearch('');}}} placeholder="Search (Press /)" className="w-full bg-black/5 dark:bg-black/20 placeholder-gray-500 dark:placeholder-white/40 rounded-md px-3 py-1.5 outline-none transition-all border border-transparent focus:bg-black/10 dark:focus:bg-black/30" style=${{fontSize:'inherit',borderColor:'var(--primary)'}} />
                            ${sAct&&sRes.length>0&&html`<div className="absolute top-full left-0 right-0 bg-card border shadow-xl max-h-64 overflow-y-auto z-50">${sRes.map((r,i)=>html`<div key=${r.id} onClick=${()=>{nav(r.id);setSAct(false);setSearch('');}} className=${`px-4 py-2 cursor-pointer ${i===sIdx?'bg-primary text-white':''}`} onMouseEnter=${()=>setSIdx(i)}>${r.title}</div>`)}</div>`}
                        </div>
                    </div>

                    <!-- Canvas -->
                    <div className="flex-1 bg-background p-3 overflow-hidden outline-none relative transition-colors duration-300">
                        <div className="flex h-full w-full gap-3">
                            <!-- Left Col -->
                            <div className="flex flex-col gap-3 w-1/4">
                                <div className=${`${vis.showFavorites?'flex-1':'h-full'} relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0`}>
                                    <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Related</div>
                                    <${NoteSection} notes=${topo.lefters} section="left" containerClasses="absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3 custom-scrollbar rounded-3xl pt-6" itemClasses="w-full" containerId="container-left" ...${sp} />
                                </div>
                                ${vis.showFavorites&&html`
                                    <div className="flex-1 relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                                        <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Favorites</div>
                                        <${NoteSection} notes=${favs} section="favs" containerClasses="absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3 custom-scrollbar rounded-3xl pt-6" itemClasses="w-full" containerId="container-favs" ...${sp} />
                                    </div>
                                `}
                            </div>

                            <!-- Center Col -->
                            <div className="flex flex-col gap-3 w-1/2">
                                <div className="flex-1 flex flex-col gap-3 min-h-0">
                                    <div className="flex-[7] relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                                        <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Parents</div>
                                        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-3xl pt-6">
                                            <${NoteSection} notes=${topo.uppers} section="up" containerClasses="h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto" itemClasses="w-[300px] flex-shrink-0" containerId="container-up" ...${sp} />
                                        </div>
                                    </div>
                                    <div className="flex-[3] relative flex items-center justify-center p-4 z-10 bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                                        <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Active Note</div>
                                        ${topo.center&&html`
                                            <${NoteCard} note=${topo.center} isCenter=${true} isFocused=${fSec==='center'} fontSize=${fs} onClick=${()=>{}} subtitle=${subT} />
                                            <div className="absolute bottom-4 right-4 flex gap-1 pointer-events-none text-yellow-600 drop-shadow-sm">
                                                ${topo.center.isFavorite&&html`<${Icons.Star} width="14" height="14" fill="currentColor" />`}
                                                ${topo.center.content&&html`<${Icons.Edit} width="14" height="14" fill="currentColor" />`}
                                            </div>
                                        `}
                                    </div>
                                </div>
                                <div className="flex-1 relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0">
                                    <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Children</div>
                                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-3xl pt-6">
                                        <${NoteSection} notes=${topo.downers} section="down" containerClasses="h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto" itemClasses="w-[300px] flex-shrink-0" containerId="container-down" ...${sp} />
                                    </div>
                                </div>
                            </div>

                            <!-- Right Col -->
                            <div className="flex flex-col gap-3 w-1/4">
                                <div className=${`${vis.showContent?'flex-1':'h-full'} relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0`}>
                                    <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Siblings</div>
                                    <${NoteSection} notes=${topo.righters} section="right" containerClasses="flex flex-col gap-0 overflow-y-auto p-3 h-full custom-scrollbar rounded-3xl pt-6" itemClasses="w-full" containerId="container-right" ...${sp} />
                                </div>
                                ${vis.showContent&&html`
                                    <div className=${`flex-1 relative bg-card rounded-3xl shadow-lg border border-black/5 dark:border-white/5 min-h-0 outline-none ${fSec==='content'?'ring-2 ring-primary':''}`}>
                                        <div className=${labelStyle} style=${{fontSize:`${Math.max(10,fs-10)}px`}}>Content</div>
                                        <div className="absolute inset-0 p-6 overflow-auto custom-scrollbar prose dark:prose-invert max-w-none rounded-3xl pt-8 compact-markdown" onClick=${async(e)=>{if(e.target.classList.contains('internal-link')&&e.target.dataset.title){e.preventDefault();const n=await findNoteByTitle(e.target.dataset.title);if(n)nav(n.id);}}} dangerouslySetInnerHTML=${{__html:prevH}} />
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style=${{fontSize:`${Math.max(12,fs-4)}px`}} className="h-8 flex-shrink-0 bg-card flex items-center justify-between px-4 text-foreground z-50 transition-colors duration-300">
                        <div className="flex-shrink-0 opacity-90">Notes: ${count} | ${getCurrentVaultName()} ${APP_VERSION}</div>
                        <div className="opacity-60 truncate ml-4 text-right">Arrows: Nav | Space: Open | Enter: Center Focus | Shift+Enter: Edit | Ctrl+Arrows: Link | F2: Rename | Bksp: Unlink</div>
                    </div>

                    <${Editor} isOpen=${ed} mode=${edMode} note=${fSec==='center'?topo.center:getSortedNotes(fSec,topo,favs)[fIdx]} onClose=${()=>setEd(false)} onSave=${(id,c)=>{updateNote(id,{content:c});if(id===currentId)getTopology(currentId).then(setTopo)}} onLink=${async(t)=>{const n=await findNoteByTitle(t);if(n)nav(n.id)}} />
                    <${LinkerModal} isOpen=${lnk} type=${lnkType} onClose=${()=>setLnk(false)} onSelect=${handleLink} />
                    <${SettingsModal} isOpen=${sett} onClose=${()=>setSett(false)} currentCentralNoteId=${currentId} fontSize=${fs} onFontSizeChange=${setFs} onThemeChange=${()=>setCount(c=>c+1)} onSettingsChange=${()=>getSectionVisibility().then(setVis)} />
                    <${ImportModal} isOpen=${imp} importData=${impD} onClose=${()=>setImp(false)} onConfirm=${m=>{importNotes(impD,m);setImp(false);window.location.reload()}} />
                    <${RenameModal} isOpen=${ren} currentTitle=${renN?renN.title:''} onClose=${()=>setRen(false)} onRename=${t=>{updateNote(renN.id,{title:t});setRen(false);getTopology(currentId).then(setTopo);}} />
                </div>
            </div>
        `;
    };
})(window.Jaroet);
