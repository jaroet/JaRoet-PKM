
(function(J) {
    const { useState, useEffect } = React;
    const { Icons } = J;

    J.CalendarDropdown = ({isOpen, onClose, onSelectDate, existingDates, onMonthChange}) => {
        const [viewDate,setViewDate]=useState(new Date());
        useEffect(()=>{if(isOpen){setViewDate(new Date());onMonthChange(new Date().getFullYear(),new Date().getMonth()+1);}},[isOpen]);
        const changeMonth=(offset)=>{const d=new Date(viewDate.getFullYear(),viewDate.getMonth()+offset,1);setViewDate(d);onMonthChange(d.getFullYear(),d.getMonth()+1);};
        const daysInMonth=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,0).getDate();
        const startDay=(new Date(viewDate.getFullYear(),viewDate.getMonth(),1).getDay()+6)%7;
        const days=[];for(let i=0;i<startDay;i++)days.push(html`<div key=${`e-${i}`} className="h-9"></div>`);
        for(let d=1;d<=daysInMonth;d++){const dateStr=`${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const has=existingDates.has(dateStr);const isToday=new Date().toDateString()===new Date(viewDate.getFullYear(),viewDate.getMonth(),d).toDateString();days.push(html`<div key=${d} onClick=${()=>onSelectDate(new Date(viewDate.getFullYear(),viewDate.getMonth(),d))} className=${`h-9 w-9 flex items-center justify-center rounded-lg cursor-pointer relative ${isToday?'text-primary font-bold':'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>${d}${has&&html`<div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary"></div>`}</div>`);}
        if(!isOpen)return null;
        return html`
            <div className="absolute top-full left-0 mt-2 w-72 bg-card border shadow-xl rounded-lg z-50 p-4" onClick=${e=>e.stopPropagation()}>
                <div className="flex justify-between mb-4">
                    <button onClick=${()=>changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><${Icons.ChevronLeft} width="16" height="16" /></button>
                    <span>${viewDate.toLocaleString('default',{month:'long',year:'numeric'})}</span>
                    <button onClick=${()=>changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><${Icons.ChevronRight} width="16" height="16" /></button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs mb-2"><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div></div>
                <div className="grid grid-cols-7 gap-1 text-center">${days}</div>
                <div className="mt-2 text-center text-xs text-primary cursor-pointer" onClick=${()=>onSelectDate(new Date())}>Today</div>
            </div>
        `;
    };
})(window.Jaroet);
