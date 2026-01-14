
(function(J) {
    const { useState, useEffect, useRef, useCallback } = React;
    const { db, getTopology, createNote, updateNote, deleteNote, getFavorites, toggleFavorite, seedDatabase, getNote, getAllNotes, importNotes, getHomeNoteId, searchNotes, getFontSize, getNoteCount, getVaultList, getCurrentVaultName, switchVault, getSectionVisibility, findNoteByTitle, getNoteTitlesByPrefix, getSortOrder, setSortOrder: persistSortOrder, getActiveThemeId, getTheme, setActiveThemeId, getThemes, getAttachmentAliases } = J.Services.DB;
    const { goToDate, goToToday, getDateSubtitle } = J.Services.Journal; 
    const { createRenderer, wikiLinkExtension, setAttachmentAliases } = J.Services.Markdown;
    const { NoteCard, LinkerModal, Editor, SettingsModal, ImportModal, RenameModal, NoteSection, TopBar, StatusBar, Icons, AllNotesModal, VaultChooser, APP_VERSION, Components: { SectionContainer } } = J;
    const { useHistory } = J.Hooks;

    marked.use({renderer:createRenderer({clickableCheckboxes:false}),extensions:[wikiLinkExtension]});

    J.App = () => {
        // --- State ---
        const {currentId,visit,replace,back,forward,canBack,canForward}=useHistory();
        const [topo,setTopo]=useState({center:null,uppers:[],downers:[],lefters:[],righters:[]}),[favs,setFavs]=useState([]),[dark,setDark]=useState(true),[fs,setFs]=useState(16),[vis,setVis]=useState({showFavorites:true,showContent:true}),[count,setCount]=useState(0),[themes,setThemes]=useState([]), [mentions, setMentions] = useState([]);
        const [sortOrder, setSortOrder] = useState('title-asc');
        
        // Navigation State
        const [fSec,setFSec]=useState('center'),[fIdx,setFIdx]=useState(0),[sel,setSel]=useState(new Set());
        const [secInd,setSecInd]=useState({up:0,down:0,left:0,right:0,favs:0,mentions:0});
        const scrollRef=useRef({});
        
        // Refs for Event Listeners
        const selRef=useRef(new Set());
        const fSecRef=useRef('center');
        const fIdxRef=useRef(0);
        const topoRef=useRef({center:null,uppers:[],downers:[],lefters:[],righters:[]});
        const favsRef=useRef([]);
        const visRef=useRef({showFavorites:true,showContent:true});
        const secIndRef=useRef({up:0,down:0,left:0,right:0,favs:0});
        const mentionsRef=useRef([]);

        // UI State & Modals (removed `menu` and `setMenu`)
        const [favDrop,setFavDrop]=useState(false),[cal,setCal]=useState(false),[calD,setCalD]=useState(new Set());
        const [vaultChooser, setVaultChooser] = useState(false);
        const [search,setSearch]=useState(''),[sRes,setSRes]=useState([]),[sIdx,setSIdx]=useState(0),[sAct,setSAct]=useState(false);
        const [ed,setEd]=useState(false),[edMode,setEdMode]=useState('view'),[lnk,setLnk]=useState(false),[lnkType,setLnkType]=useState('up'),[ren,setRen]=useState(false),[renN,setRenN]=useState(null),[sett,setSett]=useState(false),[imp,setImp]=useState(false),[impD,setImpD]=useState([]),[allNotes,setAllNotes]=useState(false);
        const [prevH,setPrevH]=useState('');
        const searchInputRef=useRef(null);

        // --- DEBUG LOGGING ---
        useEffect(() => {
            console.log(`%cSTATE CHANGE: fSec is now '${fSec}'`, 'color: orange');
        }, [fSec]);

        // --- Effects & Sync ---
        useEffect(()=>{
            const init = async () => {
                const initialId = await seedDatabase();
                const currentNoteId = (await db.meta.get('currentCentralNoteId'))?.value || initialId;
                replace(currentNoteId);
                getFontSize().then(setFs);
                getSectionVisibility().then(setVis);
                getSortOrder().then(setSortOrder);
                getFavorites().then(setFavs);
                getThemes().then(setThemes);
                getAttachmentAliases().then(a => {
                    setAttachmentAliases(a);
                    // Force re-render of content if needed, though markdown parsing happens in Editor/NoteSection
                });
                
                // Load Theme
                const tId = await getActiveThemeId();
                const theme = await getTheme(tId) || await getTheme('dark');
                if(theme) applyTheme(theme);
            };
            init();},[]);

        const applyTheme = (theme) => {
            setDark(theme.type === 'dark');
            document.documentElement.classList.toggle('dark', theme.type === 'dark');
            const root = document.documentElement;
            Object.entries(theme.values).forEach(([k, v]) => root.style.setProperty(k, v));
        };

        useEffect(()=>{
            if(currentId){
                console.log(`%cNAV EVENT: currentId changed to ${currentId}. Resetting state.`, 'color: cyan; font-weight: bold;');
                getTopology(currentId).then(setTopo);
                db.meta.put({key:'currentCentralNoteId',value:currentId});
                setFSec('center');setFIdx(0);setSel(new Set());scrollRef.current={};
                setSecInd({up:0,down:0,left:0,right:0,favs:0});
                getNoteCount().then(setCount);
            }
        },[currentId]);

        useEffect(() => {
            if (!topo.center) {
                setMentions([]);
                return;
            }
            let isMounted = true;
            db.notes.where('outgoingLinks').equals(topo.center.id).toArray().then(m => {
                if (isMounted) setMentions(m);
            });
            return () => { isMounted = false; };
        }, [topo.center]);

        // Sync Refs
        useEffect(()=>{selRef.current=sel},[sel]);
        useEffect(()=>{fSecRef.current=fSec},[fSec]);
        useEffect(()=>{fIdxRef.current=fIdx},[fIdx]);
        useEffect(()=>{topoRef.current=topo},[topo]);
        useEffect(()=>{favsRef.current=favs},[favs]);
        useEffect(()=>{visRef.current=vis},[vis]);
        useEffect(()=>{secIndRef.current=secInd},[secInd]);
        useEffect(()=>{mentionsRef.current=mentions},[mentions]);

        // Helper: Get Sorted Notes
        const sortNotes = useCallback((notes) => {
            if (!notes) return [];
            const n = [...notes];
            const getVal = (obj, key) => obj[key] || 0;
            switch (sortOrder) {
                case 'title-desc': return n.sort((a, b) => b.title.localeCompare(a.title));
                case 'created-asc': return n.sort((a, b) => getVal(a, 'createdAt') - getVal(b, 'createdAt'));
                case 'created-desc': return n.sort((a, b) => getVal(b, 'createdAt') - getVal(a, 'createdAt'));
                case 'modified-asc': return n.sort((a, b) => getVal(a, 'modifiedAt') - getVal(b, 'modifiedAt'));
                case 'modified-desc': return n.sort((a, b) => getVal(b, 'modifiedAt') - getVal(a, 'modifiedAt'));
                default: return n.sort((a, b) => a.title.localeCompare(b.title));
            }
        }, [sortOrder]);

        const getSortedNotes = (sec, t=topo, f=favs, m=mentions) => {
            if(sec==='center')return t.center?[t.center]:[];
            let n=[]; 
            if(sec==='up')n=t.uppers;
            else if(sec==='down')n=t.downers;
            else if(sec==='left')n=t.lefters;
            else if(sec==='right')n=t.righters;
            else if(sec==='favs')n=f;
            else if(sec==='mentions')n=m;
            return sortNotes(n);
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
        
        const goToRandomNote = async () => {
            const c = await getNoteCount();
            if (c > 0) {
                const offset = Math.floor(Math.random() * c);
                const note = await db.notes.offset(offset).first();
                if (note) nav(note.id);
            }
        };

        const handleLink = async (tid, t) => {
            const focusedNote = getFocusedNote();
            const aid = focusedNote ? focusedNote.id : currentId;
            if (!aid) return;

            const doL = async (id) => {
                const center = await getNote(aid);
                const target = await getNote(id);
                if (!center || !target) return;

                // Unlink any previous relationships to prevent duplicates
                if (center.linksTo.includes(id)) await updateNote(aid, { linksTo: center.linksTo.filter(x => x !== id) });
                if(target.linksTo.includes(aid)) await updateNote(id,{linksTo:target.linksTo.filter(x=>x!==aid)});
                if(center.relatedTo.includes(id)) await updateNote(aid,{relatedTo:center.relatedTo.filter(x=>x!==id)});
                if(target.relatedTo.includes(aid)) await updateNote(id,{relatedTo:target.relatedTo.filter(x=>x!==aid)});

                // Apply the new link
                if(lnkType==='up'){ const trg=await getNote(id); await updateNote(id,{linksTo:[...trg.linksTo,aid]}); }
                else if(lnkType==='down'){ const anc=await getNote(aid); await updateNote(aid,{linksTo:[...anc.linksTo,id]}); }
                else { const anc=await getNote(aid); await updateNote(aid,{relatedTo:[...anc.relatedTo,id]}); const trg=await getNote(id); await updateNote(id,{relatedTo:[...trg.relatedTo,aid]}); }
            };

            if (tid) { await doL(tid); } 
            else if (t) {
                for (let title of t.split(';').map(x => x.trim()).filter(Boolean)) {
                    if (title.startsWith(', ')) {
                        const sourceNote = await getNote(aid);
                        if (sourceNote) title = `${sourceNote.title} ${title.substring(2)}`.trim();
                    }
                    let noteToLink = await findNoteByTitle(title);
                    if (!noteToLink) noteToLink = await createNote(title);
                    await doL(noteToLink.id);
                }
            }
            if(currentId) getTopology(currentId).then(setTopo); getNoteCount().then(setCount);
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
                if(t.relatedTo.includes(currentId)) await updateNote(id,{relatedTo:t.relatedTo.filter(x=>x!==id)});
                if(type==='up') { const t2=await getNote(id); await updateNote(id,{linksTo:[...t2.linksTo,currentId]}); }
                else if(type==='down') { const c2=await getNote(currentId); await updateNote(currentId,{linksTo:[...c2.linksTo,id]}); }
                else if(type==='left') { const c2=await getNote(currentId); await updateNote(currentId,{relatedTo:[...c2.relatedTo,id]}); const t2=await getNote(id); await updateNote(id,{relatedTo:[...t2.relatedTo,currentId]}); }
            }
            getTopology(currentId).then(setTopo); setSel(new Set());
        };

        const handleLinkAction = (type) => { if(sel.size > 0) changeRelationship(type); else { setLnkType(type); setLnk(true); } };
        const handleFavToggle = async () => { const n = getFocusedNote(); if (n) { await toggleFavorite(n.id); setCount(c => c + 1); getTopology(currentId).then(setTopo); getFavorites().then(setFavs); } };
        const getItemsPerColumn = (id) => { const el = document.getElementById(id); if(!el) return 1; const kids = Array.from(el.children).filter(c=>c.id.startsWith('note-')); if(kids.length < 2) return 1; const firstLeft = kids[0].offsetLeft; for(let i=1; i<kids.length; i++) if(kids[i].offsetLeft > firstLeft + 20) return i; return kids.length; };
        const doSearch=async(q)=>{setSearch(q);if(q){setSRes(await searchNotes(q));setSIdx(0);}else setSRes([]);};
        const navSearch = (id) => { // This function now only handles search-specific UI state.
            console.log(`%cSEARCH NAV: navSearch called for id ${id}`, 'color: violet');
            nav(id);
            setSAct(false);
            setSearch('');
        };

        const exportData = async () => {
            const notes = await getAllNotes();
            const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
            const now = new Date(); const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            a.download = `JaRoetPKM_${getCurrentVaultName()}_${dateStr}.json`; a.click(); URL.revokeObjectURL(url);
        };

        const activeNote = getFocusedNote();
        const activeHasContent = activeNote && activeNote.content && activeNote.content.trim().length > 0;
        const subT=topo.center?getDateSubtitle(topo.center.title):null;
        const sp={fontSize:fs,focusedSection:fSec,focusedIndex:fIdx,selectedNoteIds:sel,centralNoteId:currentId,onNoteClick:(id,c)=>c?togSel(id):id!==currentId&&nav(id),scrollPositionsRef:scrollRef};
        const canUnlink = sel.size > 0 || ['up', 'down', 'left'].includes(fSec);

        // --- KEYBOARD HANDLER ---
        const handleGlobalKeyDown = useCallback(async (e) => {
            console.log(`%cGLOBAL KEYDOWN: key='${e.key}', sAct=${sAct}`, 'color: red');
            const selState=selRef.current, fSecState=fSecRef.current, fIdxState=fIdxRef.current, topoState=topoRef.current, favsState=favsRef.current, visState=visRef.current, secIndState=secIndRef.current, mentionsState=mentionsRef.current;
            if (ren||ed||lnk||sett||imp||cal||favDrop||allNotes||vaultChooser) { if (e.key === 'Escape') { if(cal) setCal(false); if(favDrop) setFavDrop(false); if(allNotes) setAllNotes(false); if(vaultChooser) setVaultChooser(false); } return; }
            if (sAct) {
                if (e.key==='Escape') { setSAct(false); setFSec('center'); e.preventDefault(); return; }
                if (e.key==='ArrowDown') { e.preventDefault(); setSIdx(p=>(p+1)%sRes.length); return; }
                if (e.key==='ArrowUp') { e.preventDefault(); setSIdx(p=>(p-1+sRes.length)%sRes.length); return; }
                if (e.key==='Enter') { e.preventDefault(); if(sRes[sIdx]) { navSearch(sRes[sIdx].id); } return; }
                return;
            }
            if (e.key === 'Escape') { if (selState.size > 0) { setSel(new Set()); e.preventDefault(); return; } }
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); back(); return; }
            if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); forward(); return; }
            if (e.key === '/') { e.preventDefault(); setSAct(true); setTimeout(()=>document.querySelector('input[placeholder="Search..."]')?.focus(), 50); return; }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); nav(await goToToday()); return; }
            if ((e.ctrlKey || e.metaKey) && e.altKey && (e.code === 'KeyR' || e.key.toLowerCase() === 'r')) { e.preventDefault(); goToRandomNote(); return; }
            if (e.key === 'x') {
                e.preventDefault(); const note = (fSecState==='center'||fSecState==='content') ? topoState.center : getSortedNotes(fSecState, topoState, favsState)[fIdxState];
                if (note && note.id !== currentId) { togSel(note.id); const list = getSortedNotes(fSecState, topoState, favsState); if (fIdxState < list.length - 1) setFIdx(p=>p+1); } return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
                e.preventDefault(); const targets = selState.size > 0 ? Array.from(selState) : (getFocusedNote() ? [getFocusedNote().id] : []);
                if (targets.length && confirm(`Delete ${targets.length}?`)) { for (const id of targets) await deleteNote(id); if (targets.includes(currentId)) nav(await getHomeNoteId() || (await getAllNotes())[0].id); else { getTopology(currentId).then(setTopo); getNoteCount().then(setCount); } setSel(new Set()); } return;
            }
            if (e.key === 'Backspace') { e.preventDefault(); changeRelationship('unlink'); return; }
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === 'ArrowUp') { e.preventDefault(); if(selState.size) changeRelationship('up'); else { setLnkType('up'); setLnk(true); } return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); if(selState.size) changeRelationship('down'); else { setLnkType('down'); setLnk(true); } return; }
                if (e.key === 'ArrowLeft') { e.preventDefault(); if(selState.size) changeRelationship('left'); else { setLnkType('left'); setLnk(true); } return; }
                if (e.key === 'Enter') { e.preventDefault(); setEdMode('edit'); setEd(true); return; }
            }
            if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); setEdMode('view'); setEd(true); return; }
            if (e.key === 'F2') { e.preventDefault(); const n = getFocusedNote(); if(n) { setRenN(n); setRen(true); } return; }
            if (e.key === 'Enter') { e.preventDefault(); setFSec('center'); return; }
            if (e.key === ' ') { e.preventDefault(); const n = getFocusedNote(); if(n && n.id !== currentId) nav(n.id); return; }
            
            // Tab Switching (Shift+Arrow)
            if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                if (['right', 'mentions'].includes(fSecState)) {
                    e.preventDefault();
                    const tabs = ['right', 'mentions'];
                    const currentIndex = tabs.indexOf(fSecState);
                    const direction = e.key === 'ArrowRight' ? 1 : -1;
                    const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
                    
                    // Restore index for the new tab
                    const nextList = getSortedNotes(nextTab, topoState, favsState, mentionsState);
                    const savedIdx = secIndState[nextTab] || 0;
                    const newIdx = Math.min(savedIdx, Math.max(0, nextList.length - 1));
                    
                    setFSec(nextTab);
                    setFIdx(newIdx);
                    return;
                }
            }

            // --- ARROW NAV ---
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if(fSecState==='center'){ if(topoState.uppers.length){ setFSec('up'); setFIdx(Math.min(secIndState.up, topoState.uppers.length-1)); } }
                else if(fSecState==='content'){ if (topoState.righters.length) { setFSec('right'); setFIdx(topoState.righters.length - 1); } else if (mentions.length) { setFSec('mentions'); setFIdx(mentions.length - 1); } }
                else if(fSecState==='down'){ if(fIdxState===0) setFSec('center'); else setFIdx(p=>p-1); }
                else if(fSecState==='favs'){ if(fIdxState===0){ setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); } else setFIdx(p=>p-1); }
                else setFIdx(p=>Math.max(0,p-1));
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const list = getSortedNotes(fSecState, topoState, favsState, mentionsState);
                if(fSecState==='center'){ if(topoState.downers.length){ setFSec('down'); setFIdx(Math.min(secIndState.down, topoState.downers.length-1)); } }
                else if(fSecState==='content') return;
                else if(fSecState==='up'){ if(fIdxState===list.length-1) setFSec('center'); else setFIdx(p=>p+1); }
                else if(fSecState==='left'){ if(fIdxState===list.length-1){ if(visState.showFavorites&&favsState.length){ setFSec('favs'); setFIdx(Math.min(secIndState.favs, favsState.length-1)); } } else setFIdx(p=>p+1); }
                else if(fSecState==='right' || fSecState === 'mentions'){ if(fIdxState===list.length-1){ if(visState.showContent){ setFSec('content'); } } else setFIdx(p=>p+1); }
                else setFIdx(p=>Math.min(list.length-1,p+1));
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if(['up','down','left','right','favs', 'mentions'].includes(fSecState)){ const cols = getItemsPerColumn(`container-${fSecState}`); if(fIdxState - cols >= 0){ setFIdx(p=>p-cols); return; } }
                if(fSecState==='content'){ setFSec('down'); setFIdx(Math.min(secIndState.down, topoState.downers.length-1)); }
                else if(fSecState==='center'){ if(topoState.lefters.length){ setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); } else if(visState.showFavorites&&favsState.length){ setFSec('favs'); setFIdx(0); } }
                else if(fSecState==='right' || fSecState === 'mentions'){ setFSec('up'); setFIdx(Math.min(secIndState.up, topoState.uppers.length-1)); }
                else if(fSecState==='down'){ if(visState.showFavorites&&favsState.length){ setFSec('favs'); setFIdx(Math.min(secIndState.favs, favsState.length-1)); } else { setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); } }
                else if(fSecState==='up'){ setFSec('left'); setFIdx(Math.min(secIndState.left, topoState.lefters.length-1)); }
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if(['up','down','left','right','favs', 'mentions'].includes(fSecState)){ const cols = getItemsPerColumn(`container-${fSecState}`); const list = getSortedNotes(fSecState, topoState, favsState, mentions); if(fIdxState + cols < list.length){ setFIdx(p=>p+cols); return; } }
                if(fSecState==='content') return;
                if(fSecState==='center'){ if(topo.righters.length){ setFSec('right'); setFIdx(Math.min(secIndState.right, topo.righters.length-1)); } else if (mentions.length) { setFSec('mentions'); setFIdx(Math.min(secIndState.mentions, mentions.length-1)); } else if(vis.showContent) setFSec('content'); }
                else if(fSecState==='left'){ setFSec('up'); setFIdx(Math.min(secIndState.up, topo.uppers.length-1)); }
                else if(fSecState==='favs'){ setFSec('down'); setFIdx(Math.min(secIndState.down, topo.downers.length-1)); }
                else if(fSecState==='up'){ if(topo.righters.length){ setFSec('right'); setFIdx(Math.min(secIndState.right, topo.righters.length-1)); } else if (mentions.length) { setFSec('mentions'); setFIdx(Math.min(secIndState.mentions, mentions.length-1)); } }
                else if(fSecState==='down'){ if(vis.showContent){ setFSec('content'); } else if(topo.righters.length){ setFSec('right'); setFIdx(Math.min(secIndState.right, topo.righters.length-1)); } else if (mentions.length) { setFSec('mentions'); setFIdx(Math.min(secIndState.mentions, mentions.length-1)); } }
            }
        }, [currentId, back, forward, sRes, sIdx, sAct, ren, ed, lnk, sett, imp, cal, favDrop, goToRandomNote]);

        const handleKeyDownRef = useRef(handleGlobalKeyDown);
        useEffect(() => { handleKeyDownRef.current = handleGlobalKeyDown; }, [handleGlobalKeyDown]);
        useEffect(() => { const h=(e)=>handleKeyDownRef.current(e); window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h); }, []);

        return html`
            <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans flex-col">
                <${TopBar}
                    nav=${nav} back=${back} forward=${forward} canBack=${canBack} canForward=${canForward} goHome=${async()=>{nav(await getHomeNoteId())}}
                    cal=${cal} setCal=${setCal} calD=${calD} setCalD=${setCalD} handleCalendarSelect=${async(d)=>{setCal(false);nav(await goToDate(d))}} handleCalendarMonthChange=${async(y,m)=>{const p=`${y}-${String(m).padStart(2,'0')}-`;setCalD(new Set(await getNoteTitlesByPrefix(p)))}}
                    favDrop=${favDrop} setFavDrop=${setFavDrop} favs=${favs}
                    activeNote=${activeNote} handleFavToggle=${handleFavToggle} setEd=${setEd} activeHasContent=${activeHasContent} setRenN=${setRenN} setRen=${setRen}
                    deleteNote=${deleteNote} currentId=${currentId} canUnlink=${canUnlink} changeRelationship=${changeRelationship} handleLinkAction=${handleLinkAction}
                    search=${search} doSearch=${doSearch} sAct=${sAct} setSAct=${setSAct} sRes=${sRes} sIdx=${sIdx} setSIdx=${setSIdx} navSearch=${navSearch}
                    setAllNotes=${setAllNotes}
                    goToRandomNote=${goToRandomNote}
                    onThemeSelect=${async (id) => {
                        const t = await getTheme(id);
                        if(t) { await setActiveThemeId(id); applyTheme(t); }
                    }}
                    themes=${themes}
                    dark=${dark} setSett=${setSett} exportData=${exportData} setImpD=${setImpD} setImp=${setImp} fontSize=${fs}
                    sortOrder=${sortOrder} setSortOrder=${(o)=>{setSortOrder(o);persistSortOrder(o);}}
                />

                <!-- Canvas -->
                <div 
                    className="flex-1 bg-background p-3 overflow-hidden outline-none relative transition-colors duration-300"
                    onClick=${(e) => {
                        if (e.target === e.currentTarget || e.target.classList.contains('canvas-flex-container')) setFSec('center');
                    }}
                >
                    <div className="flex h-full w-full gap-3 canvas-flex-container">
                        <!-- Left Col -->
                        <div className="flex flex-col gap-3 w-1/4">
                            <${SectionContainer} title="Related" count=${topo.lefters.length} className=${vis.showFavorites?'flex-1':'h-full'}>
                                <${NoteSection} notes=${sortNotes(topo.lefters)} section="left" containerClasses="absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3 custom-scrollbar rounded-b-3xl" itemClasses="w-full" containerId="container-left" ...${sp} />
                            </${SectionContainer}>
                            ${vis.showFavorites&&html`
                                <${SectionContainer} title="Favorites" count=${favs.length} className="flex-1">
                                    <${NoteSection} notes=${sortNotes(favs)} section="favs" containerClasses="absolute inset-0 flex flex-col gap-0 overflow-y-auto p-3 custom-scrollbar rounded-b-3xl" itemClasses="w-full" containerId="container-favs" ...${sp} />
                                </${SectionContainer}>
                            `}
                        </div>

                        <!-- Center Col -->
                        <div className="flex flex-col gap-3 w-1/2">
                            <div className="flex-1 flex flex-col gap-3 min-h-0">
                                <${SectionContainer} title="Parents" count=${topo.uppers.length} className="flex-[7]">
                                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-b-3xl">
                                        <${NoteSection} notes=${sortNotes(topo.uppers)} section="up" containerClasses="h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto" itemClasses="w-[300px] flex-shrink-0" containerId="container-up" ...${sp} />
                                    </div>
                                </${SectionContainer}>
                                <${SectionContainer} title="Active Note" className="flex-[3] z-10" contentClasses="flex-1 min-h-0 relative flex items-center justify-center p-4">
                                    ${topo.center&&html`
                                        <${NoteCard} note=${topo.center} isCenter=${true} isFocused=${fSec==='center'} fontSize=${fs} onClick=${()=>{}} subtitle=${subT} />
                                        <div className="absolute bottom-4 right-4 flex gap-1 pointer-events-none text-yellow-600 drop-shadow-sm">
                                            ${topo.center.isFavorite&&html`<${Icons.Star} width="14" height="14" fill="currentColor" />`}
                                            ${topo.center.content&&html`<${Icons.Edit} width="14" height="14" fill="currentColor" />`}
                                        </div>
                                    `}
                                </${SectionContainer}>
                            </div>
                            <${SectionContainer} title="Children" count=${topo.downers.length} className="flex-1">
                                <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar rounded-b-3xl">
                                    <${NoteSection} notes=${sortNotes(topo.downers)} section="down" containerClasses="h-full w-fit flex flex-col flex-wrap content-start gap-0 p-3 mx-auto" itemClasses="w-[300px] flex-shrink-0" containerId="container-down" ...${sp} />
                                </div>
                            </${SectionContainer}>
                        </div>

                        <!-- Right Col -->
                        <${J.Components.RightPane} activeNote=${topo.center} topology=${topo} mentions=${mentions} sortNotes=${sortNotes} showContent=${vis.showContent} prevH=${prevH} nav=${nav} setFSec=${setFSec} ...${sp} />
                    </div>
                </div>

                <${StatusBar} noteCount=${count} vaultName=${getCurrentVaultName()} version=${APP_VERSION} fontSize=${fs} onVaultClick=${() => setVaultChooser(p => !p)} activeNote=${activeNote} />

                <${Editor} 
                    isOpen=${ed} mode=${edMode} note=${fSec==='center'?topo.center:getSortedNotes(fSec,topo,favs)[fIdx]} 
                    onClose=${()=>setEd(false)} 
                    onSave=${async (id, c) => {
                        const WIKI_LINK_REGEX = /\[\[([^|\]\n]+)(?:\|[^\]\n]*)?\]\]/g;
                        const outgoingLinkIds = new Set();
                        let match;
                        const allNotes = await getAllNotes();
                        const titleToIdMap = new Map(allNotes.map(note => [note.title.toLowerCase(), note.id]));
                        WIKI_LINK_REGEX.lastIndex = 0;
                        while ((match = WIKI_LINK_REGEX.exec(c)) !== null) {
                            const linkTitle = match[1].trim().toLowerCase();
                            if (titleToIdMap.has(linkTitle)) {
                                outgoingLinkIds.add(titleToIdMap.get(linkTitle));
                            }
                        }
                        // Use a transaction to ensure getTopology reads the updated data
                        await db.transaction('rw', db.notes, async () => {
                            await updateNote(id, { content: c, outgoingLinks: Array.from(outgoingLinkIds) });
                            if (id === currentId) {
                                await getTopology(currentId).then(setTopo);
                            }
                        });
                    }}
                    onLink=${async(t)=>{const n=await findNoteByTitle(t);if(n)nav(n.id)}} 
                />
                <${VaultChooser} 
                    isOpen=${vaultChooser} 
                    onClose=${() => setVaultChooser(false)} 
                    onManage=${() => {
                        setVaultChooser(false);
                        setSett({ open: true, initialTab: 'database', focusOn: 'newVaultInput' });
                    }}
                />
                <${LinkerModal} isOpen=${lnk} type=${lnkType} onClose=${()=>setLnk(false)} onSelect=${handleLink} sourceNoteId=${getFocusedNote()?.id || currentId} />
                <${SettingsModal} isOpen=${sett.open || sett === true} onClose=${()=>setSett(false)} currentCentralNoteId=${currentId} fontSize=${fs} onFontSizeChange=${setFs} onThemeChange=${async ()=>{
                    const tId = await getActiveThemeId();
                    const t = await getTheme(tId);
                    if(t) applyTheme(t);
                    getThemes().then(setThemes);
                }} onSettingsChange=${async ()=>{
                    getSectionVisibility().then(setVis);
                    setAttachmentAliases(await getAttachmentAliases());
                }} initialTab=${sett.initialTab} focusOn=${sett.focusOn} />
                <${ImportModal} isOpen=${imp} importData=${impD} onClose=${()=>setImp(false)} onConfirm=${async m=>{await importNotes(impD,m);setImp(false);window.location.reload()}} />
                <${RenameModal} isOpen=${ren} currentTitle=${renN?renN.title:''} onClose=${()=>setRen(false)} onRename=${t=>{updateNote(renN.id,{title:t});setRen(false);getTopology(currentId).then(setTopo);}} />
                <${AllNotesModal} isOpen=${allNotes} onClose=${()=>setAllNotes(false)} onSelect=${id=>{setAllNotes(false);nav(id);}} />
            </div>
        `;
    };
})(window.Jaroet);
