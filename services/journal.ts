import { createNote, getNote, findNoteByTitle, updateNote } from './db';
import { Note } from '../types';

// Helper: Format Date
// We no longer need day/month arrays for titles, but keeping them if we ever need content generation later.
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    // const dayName = days[d.getDay()]; // Unused in new format
    // const monthName = months[d.getMonth()]; // Unused in new format
    
    return {
        full: `${yyyy}-${mm}-${dd}`,
        month: `${yyyy}-${mm}`,
        year: `${yyyy}`,
        raw: d
    };
};

export const goToToday = async (): Promise<string> => {
    const now = new Date();
    const dateInfo = formatDate(now);
    
    // 1. Ensure Root Hub
    let hub = await findNoteByTitle('Journal Hub');
    if (!hub) {
        hub = await createNote('Journal Hub');
        await updateNote(hub.id, { 
            content: '# Journal Hub\n\nThe root of your chronological journey.',
            isFavorite: true 
        });
    }

    // 2. Ensure Year (Title: "YYYY")
    let yearNote = await findNoteByTitle(dateInfo.year);
    if (!yearNote) {
        yearNote = await createNote(dateInfo.year);
        // Link Year to Hub (Hub is Parent/Upper)
        const freshHub = await getNote(hub.id);
        if (freshHub && !freshHub.linksTo.includes(yearNote.id)) {
            await updateNote(hub.id, { linksTo: [...freshHub.linksTo, yearNote.id] });
        }
    }

    // 3. Ensure Month (Title: "YYYY-MM")
    let monthNote = await findNoteByTitle(dateInfo.month);
    if (!monthNote) {
        monthNote = await createNote(dateInfo.month);
        // Link Month to Year (Year is Parent)
        const freshYear = await getNote(yearNote.id);
        if (freshYear && !freshYear.linksTo.includes(monthNote.id)) {
            await updateNote(yearNote.id, { linksTo: [...freshYear.linksTo, monthNote.id] });
        }
    }

    // 4. Ensure Today (Title: "YYYY-MM-DD")
    let dayNote = await findNoteByTitle(dateInfo.full);
    
    // Check if it's newly created
    if (!dayNote) {
        dayNote = await createNote(dateInfo.full);
        
        // Link Day to Month (Month is Parent)
        const freshMonth = await getNote(monthNote.id);
        if (freshMonth && !freshMonth.linksTo.includes(dayNote.id)) {
            await updateNote(monthNote.id, { linksTo: [...freshMonth.linksTo, dayNote.id] });
        }

        // 5. Link Yesterday (Lateral)
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yInfo = formatDate(yesterdayDate);
        const yesterdayNote = await findNoteByTitle(yInfo.full);
        
        if (yesterdayNote) {
             const freshDay = await getNote(dayNote.id);
             const freshYesterday = await getNote(yesterdayNote.id);
             
             if (freshDay && freshYesterday) {
                 if (!freshDay.relatedTo.includes(yesterdayNote.id)) {
                     await updateNote(freshDay.id, { relatedTo: [...freshDay.relatedTo, yesterdayNote.id] });
                 }
                 if (!freshYesterday.relatedTo.includes(freshDay.id)) {
                     await updateNote(freshYesterday.id, { relatedTo: [...freshYesterday.relatedTo, freshDay.id] });
                 }
             }
        }

        // 6. Link "On This Day" (Lateral - Previous Years)
        // We check up to 5 years back
        for (let i = 1; i <= 5; i++) {
            const pastDate = new Date(now);
            pastDate.setFullYear(pastDate.getFullYear() - i);
            const pInfo = formatDate(pastDate);
            const pastNote = await findNoteByTitle(pInfo.full);
            
            if (pastNote) {
                const freshDay = await getNote(dayNote.id); // Refresh
                const freshPast = await getNote(pastNote.id);
                
                if (freshDay && freshPast) {
                     if (!freshDay.relatedTo.includes(pastNote.id)) {
                        await updateNote(freshDay.id, { relatedTo: [...freshDay.relatedTo, pastNote.id] });
                     }
                     if (!freshPast.relatedTo.includes(freshDay.id)) {
                        await updateNote(freshPast.id, { relatedTo: [...freshPast.relatedTo, freshDay.id] });
                     }
                }
            }
        }
    }

    return dayNote.id;
};