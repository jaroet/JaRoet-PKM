
(function(J) {
    const VL='nexusnode_vaults',CV='nexusnode_current_vault',DV='JaRoet-PKM';
    if(!localStorage.getItem(VL))localStorage.setItem(VL,JSON.stringify([DV]));
    if(!localStorage.getItem(CV))localStorage.setItem(CV,DV);
    
    const getVaultList=()=>JSON.parse(localStorage.getItem(VL)||'[]');
    const getCurrentVaultName=()=>localStorage.getItem(CV)||DV;
    
    class DB extends Dexie{constructor(){super(getCurrentVaultName());
        this.version(1).stores({notes:'id,title,*linksTo,*relatedTo',meta:'key'});
        this.version(2).stores({notes:'id,title,*linksTo,*relatedTo,createdAt,modifiedAt'});
        this.version(3).stores({notes:'id,title,*linksTo,*relatedTo,createdAt,modifiedAt', themes: 'id'});
    }}
    const db=new DB(); 

    // Request persistent storage to prevent eviction
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persisted().then(persisted => {
            if (!persisted) {
                navigator.storage.persist().then(granted => {
                    console.log(`Storage persistence: ${granted ? 'granted' : 'denied'}`);
                });
            }
        });
    }

    const switchVault=(n)=>{if(getVaultList().includes(n)){localStorage.setItem(CV,n);window.location.reload();}};
    const createVault=(n)=>{const l=getVaultList(),s=n.trim();if(s&&!l.includes(s)){l.push(s);localStorage.setItem(VL,JSON.stringify(l));localStorage.setItem(CV,s);window.location.reload();}};
    const deleteCurrentVault=async()=>{const c=getCurrentVaultName();db.close();await Dexie.delete(c);let l=getVaultList().filter(v=>v!==c);if(!l.length)l.push(DV);localStorage.setItem(VL,JSON.stringify(l));localStorage.setItem(CV,l[0]);window.location.reload();};
    const resetCurrentVault=async()=>{await db.transaction('rw',db.notes,db.meta,async()=>{await db.notes.clear();await db.meta.clear();});window.location.reload();};
    
    const seedDatabase=async()=>{
        if(await db.notes.count()===0){
            const id=crypto.randomUUID(),now=Date.now();
            await db.notes.add({id,title:'Welcome',content:'# Welcome\n\nStart typing...',linksTo:[],relatedTo:[],isFavorite:false,createdAt:now,modifiedAt:now});
            await db.meta.put({key:'currentCentralNoteId',value:id});await db.meta.put({key:'favoritesList',value:[]});await db.meta.put({key:'homeNoteId',value:id});
        }
        
        // Seed Themes (Version 3 feature)
        const defaultThemes = [
                {
                    id: 'light', name: 'JaRoet Light', type: 'light',
                    values: {
                        '--background': '#f8fafc', '--foreground': '#0f172a', '--card': '#ffffff', '--card-foreground': '#0f172a',
                        '--primary': '#3b82f6', '--primary-foreground': '#ffffff', '--scrollbar-thumb': '#94a3b8',
                        '--theme-bg': '#f1f5f9', '--theme-section': '#ffffff', '--theme-bars': '#e2e8f0', '--theme-accent': '#3b82f6'
                    }
                },
                {
                    id: 'solarized-light', name: 'Solarized Light', type: 'light',
                    values: {
                        '--background': '#fdf6e3', '--foreground': '#657b83', '--card': '#eee8d5', '--card-foreground': '#586e75',
                        '--primary': '#268bd2', '--primary-foreground': '#ffffff', '--scrollbar-thumb': '#93a1a1',
                        '--theme-bg': '#fdf6e3', '--theme-section': '#eee8d5', '--theme-bars': '#eee8d5', '--theme-accent': '#268bd2'
                    }
                },
                {
                    id: 'nord-light', name: 'Nord Light', type: 'light',
                    values: {
                        '--background': '#eceff4', '--foreground': '#2e3440', '--card': '#e5e9f0', '--card-foreground': '#2e3440',
                        '--primary': '#5e81ac', '--primary-foreground': '#eceff4', '--scrollbar-thumb': '#d8dee9',
                        '--theme-bg': '#eceff4', '--theme-section': '#e5e9f0', '--theme-bars': '#d8dee9', '--theme-accent': '#5e81ac'
                    }
                },
                {
                    id: 'github-light', name: 'GitHub Light', type: 'light',
                    values: {
                        '--background': '#ffffff', '--foreground': '#24292f', '--card': '#f6f8fa', '--card-foreground': '#24292f',
                        '--primary': '#0969da', '--primary-foreground': '#ffffff', '--scrollbar-thumb': '#d0d7de',
                        '--theme-bg': '#ffffff', '--theme-section': '#f6f8fa', '--theme-bars': '#f6f8fa', '--theme-accent': '#0969da'
                    }
                },
                {
                    id: 'sepia', name: 'Sepia (Warm)', type: 'light',
                    values: {
                        '--background': '#f4ecd8', '--foreground': '#5b4636', '--card': '#e4d8b4', '--card-foreground': '#5b4636',
                        '--primary': '#d2691e', '--primary-foreground': '#ffffff', '--scrollbar-thumb': '#c0b090',
                        '--theme-bg': '#f4ecd8', '--theme-section': '#e4d8b4', '--theme-bars': '#e4d8b4', '--theme-accent': '#d2691e'
                    }
                },
                {
                    id: 'dark', name: 'JaRoet Dark', type: 'dark',
                    values: {
                        '--background': '#0f172a', '--foreground': '#f8fafc', '--card': '#1e293b', '--card-foreground': '#f8fafc',
                        '--primary': '#60a5fa', '--primary-foreground': '#0f172a', '--scrollbar-thumb': '#475569',
                        '--theme-bg': '#0f172a', '--theme-section': '#1e293b', '--theme-bars': '#0f172a', '--theme-accent': '#60a5fa'
                    }
                },
                {
                    id: 'dracula', name: 'Dracula', type: 'dark',
                    values: {
                        '--background': '#282a36', '--foreground': '#f8f8f2', '--card': '#44475a', '--card-foreground': '#f8f8f2',
                        '--primary': '#bd93f9', '--primary-foreground': '#282a36', '--scrollbar-thumb': '#6272a4',
                        '--theme-bg': '#282a36', '--theme-section': '#44475a', '--theme-bars': '#282a36', '--theme-accent': '#bd93f9'
                    }
                },
                {
                    id: 'monokai', name: 'Monokai', type: 'dark',
                    values: {
                        '--background': '#272822', '--foreground': '#f8f8f2', '--card': '#3e3d32', '--card-foreground': '#f8f8f2',
                        '--primary': '#a6e22e', '--primary-foreground': '#272822', '--scrollbar-thumb': '#75715e',
                        '--theme-bg': '#272822', '--theme-section': '#3e3d32', '--theme-bars': '#272822', '--theme-accent': '#a6e22e'
                    }
                },
                {
                    id: 'nord-dark', name: 'Nord Dark', type: 'dark',
                    values: {
                        '--background': '#2e3440', '--foreground': '#d8dee9', '--card': '#3b4252', '--card-foreground': '#d8dee9',
                        '--primary': '#88c0d0', '--primary-foreground': '#2e3440', '--scrollbar-thumb': '#4c566a',
                        '--theme-bg': '#2e3440', '--theme-section': '#3b4252', '--theme-bars': '#2e3440', '--theme-accent': '#88c0d0'
                    }
                },
                {
                    id: 'github-dark', name: 'GitHub Dark', type: 'dark',
                    values: {
                        '--background': '#0d1117', '--foreground': '#c9d1d9', '--card': '#161b22', '--card-foreground': '#c9d1d9',
                        '--primary': '#58a6ff', '--primary-foreground': '#0d1117', '--scrollbar-thumb': '#30363d',
                        '--theme-bg': '#0d1117', '--theme-section': '#161b22', '--theme-bars': '#0d1117', '--theme-accent': '#58a6ff'
                    }
                }
        ];

        const existingIds = new Set(await db.themes.toCollection().primaryKeys());
        const missing = defaultThemes.filter(t => !existingIds.has(t.id));
        if(missing.length > 0) await db.themes.bulkAdd(missing);
        
        if(!(await db.meta.get('activeThemeId'))) await db.meta.put({key:'activeThemeId', value:'dark'});
        
        return (await db.meta.get('currentCentralNoteId'))?.value;
    };

    const getNote=(id)=>db.notes.get(id);
    const findNoteByTitle=(t)=>db.notes.where('title').equalsIgnoreCase(t).first();
    const getNoteTitlesByPrefix=async(p)=>(await db.notes.where('title').startsWith(p).toArray()).map(n=>n.title);
    const createNote=async(t)=>{const n={id:crypto.randomUUID(),title:t,content:'',linksTo:[],relatedTo:[],isFavorite:false,createdAt:Date.now(),modifiedAt:Date.now()};await db.notes.add(n);return n;};
    const updateNote=(id,u)=>db.notes.update(id,{...u,modifiedAt:Date.now()});
    const deleteNote=async(id)=>db.transaction('rw',db.notes,db.meta,async()=>{await db.notes.delete(id);await db.notes.where('linksTo').equals(id).modify(n=>{n.linksTo=n.linksTo.filter(x=>x!==id);n.modifiedAt=Date.now();});await db.notes.where('relatedTo').equals(id).modify(n=>{n.relatedTo=n.relatedTo.filter(x=>x!==id);n.modifiedAt=Date.now();});const f=await db.meta.get('favoritesList');if(f&&f.value.includes(id))await db.meta.put({key:'favoritesList',value:f.value.filter(x=>x!==id)});});
    const getNoteCount=()=>db.notes.count();
    
    const getTopology=async(cid)=>{
        const c=await db.notes.get(cid);if(!c)return{center:null,uppers:[],downers:[],lefters:[],righters:[]};
        const u=await db.notes.where('linksTo').equals(cid).toArray(),d=await db.notes.bulkGet(c.linksTo),l=await db.notes.bulkGet(c.relatedTo),rm=new Map();
        const siblingLists = await Promise.all(u.map(up => db.notes.bulkGet(up.linksTo)));
        siblingLists.forEach(l => l.forEach(s => { if(s && s.id !== cid) rm.set(s.id, s); }));
        return{center:c,uppers:u.filter(Boolean),downers:d.filter(Boolean),lefters:l.filter(Boolean),righters:Array.from(rm.values())};
    };
    
    const getFavorites=async()=>{const m=await db.meta.get('favoritesList');return(await db.notes.bulkGet(m?m.value:[])).filter(Boolean);};
    const toggleFavorite=async(id)=>{const n=await db.notes.get(id);if(n){await updateNote(id,{isFavorite:!n.isFavorite});const f=await db.meta.get('favoritesList'),l=f?f.value:[];await db.meta.put({key:'favoritesList',value:!n.isFavorite?[...l,id]:l.filter(x=>x!==id)});}};
    const getHomeNoteId=async()=>(await db.meta.get('homeNoteId'))?.value;
    const setHomeNoteId=(id)=>db.meta.put({key:'homeNoteId',value:id});
    const getFontSize=async()=>(await db.meta.get('fontSize'))?.value||16;
    const setFontSize=(v)=>db.meta.put({key:'fontSize',value:v});
    const getSectionVisibility=async()=>({showFavorites:(await db.meta.get('ui_showFavorites'))?.value??true,showContent:(await db.meta.get('ui_showContent'))?.value??true});
    const setSectionVisibility=(k,v)=>db.meta.put({key:`ui_${k}`,value:v});
    
    // Theme Methods
    const getThemes = () => db.themes.toArray();
    const getTheme = (id) => db.themes.get(id);
    const saveTheme = (theme) => db.themes.put(theme);
    const deleteTheme = (id) => db.themes.delete(id);
    const getActiveThemeId = async () => (await db.meta.get('activeThemeId'))?.value || 'dark';
    const setActiveThemeId = (id) => db.meta.put({key:'activeThemeId', value:id});

    const getSortOrder=async()=>(await db.meta.get('ui_sortOrder'))?.value||'title-asc';
    const setSortOrder=(v)=>db.meta.put({key:'ui_sortOrder',value:v});
    const searchNotes = async (q) => {
        const query = q.trim();
        if (!query) return [];
        const lowerCaseQuery = query.toLowerCase();
    
        const allNotes = await db.notes.toArray();
        const scoredResults = [];
    
        const escapedQuery = lowerCaseQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundaryRegex = new RegExp(`\\b${escapedQuery}\\b`);

        for (const note of allNotes) {
            const lowerCaseTitle = note.title.toLowerCase();
            const matchIndex = lowerCaseTitle.indexOf(lowerCaseQuery);
    
            if (matchIndex !== -1) {
                let score = 0;
                // 1. Big bonus for starting with the query
                if (matchIndex === 0) score += 100;
                // 2. Bonus for being a whole word match
                if (wordBoundaryRegex.test(lowerCaseTitle)) score += 50;
                // 3. Score based on position (higher score for earlier match)
                score += 10 / (matchIndex + 1);
                // 4. Score based on title length (higher score for shorter titles)
                score += 10 / note.title.length;

                scoredResults.push({ id: note.id, title: note.title, score: score });
            }
        }
        return scoredResults.sort((a, b) => b.score - a.score).slice(0, 200);
    };
    const getAllNotes=()=>db.notes.toArray();
    const getAllNotesSortedBy=async(field)=>db.notes.orderBy(field).reverse().toArray();
    
    const importNotes=async(notes,mode)=>{
        if(mode==='overwrite'){
            await db.notes.clear();for(let i=0;i<notes.length;i+=50)await db.notes.bulkAdd(notes.slice(i,i+50));
            await db.meta.put({key:'favoritesList',value:notes.filter(n=>n.isFavorite).map(n=>n.id)});
            if(notes[0]){await db.meta.put({key:'currentCentralNoteId',value:notes[0].id});await db.meta.put({key:'homeNoteId',value:notes[0].id});}
        }else{
            const ex=new Set((await db.notes.toArray()).map(n=>n.title.toLowerCase())),map=new Map(),add=[],ren=[];
            notes.forEach(n=>map.set(n.id,crypto.randomUUID()));
            for(const n of notes){
                let t=n.title,c=1,r=false;while(ex.has(t.toLowerCase())){t=`${n.title} (${c++})`;r=true;}ex.add(t.toLowerCase());
                const nid=map.get(n.id);if(r)ren.push(nid);
                add.push({...n,id:nid,title:t,linksTo:n.linksTo.map(x=>map.get(x)).filter(Boolean),relatedTo:n.relatedTo.map(x=>map.get(x)).filter(Boolean)});
            }
            if(ren.length)add.push({id:crypto.randomUUID(),title:`import_${Date.now()}`,content:'Renamed items',linksTo:ren,relatedTo:[],isFavorite:false,createdAt:Date.now(),modifiedAt:Date.now()});
            for(let i=0;i<add.length;i+=50)await db.notes.bulkAdd(add.slice(i,i+50));
        }
    };

    J.Services.DB = {
        db, getVaultList, getCurrentVaultName, switchVault, createVault, deleteCurrentVault, resetCurrentVault,
        seedDatabase, getNote, findNoteByTitle, getNoteTitlesByPrefix, createNote, updateNote, deleteNote, getNoteCount,
        getTopology, getFavorites, toggleFavorite, getHomeNoteId, setHomeNoteId, getFontSize, setFontSize, getSectionVisibility,
        setSectionVisibility, getThemes, getTheme, saveTheme, deleteTheme, getActiveThemeId, setActiveThemeId,
        getSortOrder, setSortOrder,
        searchNotes, getAllNotes, getAllNotesSortedBy, importNotes
    };
})(window.Jaroet);
