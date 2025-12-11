
export interface DateInfo {
    full: string;
    month: string;
    year: string;
    raw: Date;
}

export const formatDateForJournal = (d: Date): DateInfo => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    return {
        full: `${yyyy}-${mm}-${dd}`,
        month: `${yyyy}-${mm}`,
        year: `${yyyy}`,
        raw: d
    };
};

export const getDateSubtitle = (title: string): string | null => {
    // Regex for YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(title)) {
        const [y, m, d] = title.split('-').map(Number);
        // Note: Months are 0-indexed in JS Date
        const date = new Date(y, m - 1, d);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        }
    }
    // Regex for YYYY-MM
    if (/^\d{4}-\d{2}$/.test(title)) {
        const [y, m] = title.split('-').map(Number);
        const date = new Date(y, m - 1, 1);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'long' });
        }
    }
    return null;
};
