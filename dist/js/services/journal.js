
(function(J) {
    const { createNote, findNoteByTitle, updateNote, getNote } = J.Services.DB;

    const formatDateForJournal = (d) => {
        const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
        return { full: `${y}-${m}-${dd}`, month: `${y}-${m}`, year: `${y}`, raw: d };
    };

    const getDateSubtitle = (t) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
            const [y, m, d] = t.split('-').map(Number), dt = new Date(y, m - 1, d);
            return !isNaN(dt.getTime()) ? dt.toLocaleDateString('en-US', { weekday: 'long' }) : null;
        }
        if (/^\d{4}-\d{2}$/.test(t)) {
            const [y, m] = t.split('-').map(Number), dt = new Date(y, m - 1, 1);
            return !isNaN(dt.getTime()) ? dt.toLocaleDateString('en-US', { month: 'long' }) : null;
        }
        return null;
    };

    const goToDate = async (d) => {
        const i=formatDateForJournal(d);let h=await findNoteByTitle('Journal Hub');if(!h){h=await createNote('Journal Hub');await updateNote(h.id,{content:'# Journal Hub',isFavorite:true});}
        let y=await findNoteByTitle(i.year);if(!y){y=await createNote(i.year);const fh=await getNote(h.id);if(!fh.linksTo.includes(y.id))await updateNote(h.id,{linksTo:[...fh.linksTo,y.id]});}
        let m=await findNoteByTitle(i.month);if(!m){m=await createNote(i.month);const fy=await getNote(y.id);if(!fy.linksTo.includes(m.id))await updateNote(y.id,{linksTo:[...fy.linksTo,m.id]});}
        let da=await findNoteByTitle(i.full);if(!da){
            da=await createNote(i.full);const fm=await getNote(m.id);if(!fm.linksTo.includes(da.id))await updateNote(m.id,{linksTo:[...fm.linksTo,da.id]});
            const pd=new Date(d);pd.setDate(pd.getDate()-1);const pn=await findNoteByTitle(formatDateForJournal(pd).full);
            if(pn){await updateNote(da.id,{relatedTo:[...da.relatedTo,pn.id]});await updateNote(pn.id,{relatedTo:[...pn.relatedTo,da.id]});}
        }return da.id;
    };

    const goToToday = () => goToDate(new Date());

    J.Services.Journal = {
        formatDateForJournal, getDateSubtitle, goToDate, goToToday
    };
})(window.Jaroet);
