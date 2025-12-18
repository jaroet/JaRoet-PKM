
(function(J) {
    const VL='nexusnode_vaults',CV='nexusnode_current_vault',DV='JaRoet-PKM';
    if(!localStorage.getItem(VL))localStorage.setItem(VL,JSON.stringify([DV]));
    if(!localStorage.getItem(CV))localStorage.setItem(CV,DV);
    
    const getVaultList=()=>JSON.parse(localStorage.getItem(VL)||'[]');
    const getCurrentVaultName=()=>localStorage.getItem(CV)||DV;
    
    class DB extends Dexie{constructor(){super(getCurrentVaultName());
        this.version(1).stores({notes:'id,title,*linksTo,*relatedTo',meta:'key'});
        this.version(2).stores({notes:'id,title,*linksTo,*relatedTo,createdAt,modifiedAt'});
    }}
    const db=new DB(); 

    const switchVault=(n)=>{if(getVaultList().includes(n)){localStorage.setItem(CV,n);window.location.reload();}};
    const createVault=(n)=>{const l=getVaultList(),s=n.trim();if(s&&!l.includes(s)){l.push(s);localStorage.setItem(VL,JSON.stringify(l));localStorage.setItem(CV,s);window.location.reload();}};
    const deleteCurrentVault=async()=>{const c=getCurrentVaultName();db.close();await Dexie.delete(c);let l=getVaultList().filter(v=>v!==c);if(!l.length)l.push(DV);localStorage.setItem(VL,JSON.stringify(l));localStorage.setItem(CV,l[0]);window.location.reload();};
    const resetCurrentVault=async()=>{await db.transaction('rw',db.notes,db.meta,async()=>{await db.notes.clear();await db.meta.clear();});window.location.reload();};
    
    const seedDatabase=async()=>{
        if(await db.notes.count()===0){
            const id=crypto.randomUUID(),now=Date.now();
            await db.notes.add({id,title:'Welcome',content:'# Welcome\n\nStart typing...',linksTo:[],relatedTo:[],isFavorite:false,createdAt:now,modifiedAt:now});
            await db.meta.put({key:'currentCentralNoteId',value:id});await db.meta.put({key:'favoritesList',value:[]});await db.meta.put({key:'homeNoteId',value:id});
            return id;
        } return null;
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
        for(const up of u){(await db.notes.bulkGet(up.linksTo)).forEach(s=>{if(s&&s.id!==cid)rm.set(s.id,s);})};
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
    const getAppTheme=async()=>(await db.meta.get('appTheme'))?.value||{light:{background:'#f1f5f9',section:'#ffffff',accent:'#3b82f6',bars:'#e2e8f0'},dark:{background:'#1e293b',section:'#0f172a',accent:'#60a5fa',bars:'#0f172a'}};
    const setAppTheme=(v)=>db.meta.put({key:'appTheme',value:v});
    const getThemeMode=async()=>(await db.meta.get('themeMode'))?.value||'dark';
    const setThemeMode=(v)=>db.meta.put({key:'themeMode',value:v});
    const searchNotes = async (q) => {
        const query = q.trim();
        if (!query) return [];
        const lowerCaseQuery = query.toLowerCase();
    
        const allNotes = await db.notes.toArray();
        const scoredResults = [];
    
        for (const note of allNotes) {
            const lowerCaseTitle = note.title.toLowerCase();
            const matchIndex = lowerCaseTitle.indexOf(lowerCaseQuery);
    
            if (matchIndex !== -1) {
                let score = 0;
                // 1. Big bonus for starting with the query
                if (matchIndex === 0) score += 100;
                // 2. Bonus for being a whole word match
                // Escape special regex characters from the query
                const escapedQuery = lowerCaseQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordBoundaryRegex = new RegExp(`\\b${escapedQuery}\\b`);
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
        setSectionVisibility, getAppTheme, setAppTheme, getThemeMode, setThemeMode,
        searchNotes, getAllNotes, getAllNotesSortedBy, importNotes
    };
})(window.Jaroet);
