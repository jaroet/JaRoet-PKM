
import React, { useState, useEffect } from 'react';

interface CalendarDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: Date) => void;
    existingDates: Set<string>; // YYYY-MM-DD
    onMonthChange: (year: number, month: number) => void;
}

const CalendarDropdown: React.FC<CalendarDropdownProps> = ({ isOpen, onClose, onSelectDate, existingDates, onMonthChange }) => {
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            setViewDate(new Date());
            onMonthChange(new Date().getFullYear(), new Date().getMonth() + 1);
        }
    }, [isOpen]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        setViewDate(prev);
        onMonthChange(prev.getFullYear(), prev.getMonth() + 1);
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        setViewDate(next);
        onMonthChange(next.getFullYear(), next.getMonth() + 1);
    };

    const handleDayClick = (day: number) => {
        const target = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onSelectDate(target);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    // Calculate start day assuming Monday is 0, Sunday is 6
    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        // Native getDay(): Sun=0, Mon=1...
        // We want: Mon=0, Tue=1... Sun=6
        return (day + 6) % 7;
    };

    if (!isOpen) return null;

    const daysInMonth = getDaysInMonth(viewDate);
    const startDay = getFirstDayOfMonth(viewDate);
    const days = [];
    
    // Empty slots for start of week
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-9"></div>);
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth();

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEntry = existingDates.has(dateStr);
        const isToday = isCurrentMonth && d === today.getDate();

        days.push(
            <div 
                key={d}
                onClick={() => handleDayClick(d)}
                className={`
                    h-9 w-9 flex items-center justify-center rounded-lg cursor-pointer text-sm relative transition-all group
                    ${isToday 
                        ? 'text-primary font-extrabold text-base' 
                        : 'text-foreground font-medium hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                `}
            >
                <span className="z-10">{d}</span>
                
                {hasEntry && (
                    <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary"></div>
                )}
            </div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-card text-foreground border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg z-50 p-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span className="font-bold">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>

            {/* Days Header (Monday Start) */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs text-gray-500 font-semibold">
                <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {days}
            </div>

             {/* Footer */}
             <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <button 
                    className="text-xs text-primary hover:underline"
                    onClick={() => onSelectDate(new Date())}
                >
                    Jump to Today
                </button>
             </div>
        </div>
    );
};

export default CalendarDropdown;
