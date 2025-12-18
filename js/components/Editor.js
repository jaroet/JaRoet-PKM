
(function(J) {
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    const { searchNotes } = J.Services.DB;
    const { createRenderer } = J.Services.Markdown;

    // Helper to get caret coordinates for autocomplete popup
    const getCaretCoordinates = (element, position) => {
        const div = document.createElement('div');
        const style = window.getComputedStyle(element);
        Array.from(style).forEach(prop => div.style.setProperty(prop, style.getPropertyValue(prop)));
        div.style.position = 'absolute'; div.style.visibility = 'hidden'; div.style.whiteSpace = 'pre-wrap';
        div.style.top = '0'; div.style.left = '0';
        div.textContent = element.value.substring(0, position);
        const span = document.createElement('span'); span.textContent = element.value.substring(position) || '.';
        div.appendChild(span);
        document.body.appendChild(div);
        const coordinates = { top: span.offsetTop + parseInt(style.borderTopWidth), left: span.offsetLeft + parseInt(style.borderLeftWidth), height: parseInt(style.lineHeight) };
        document.body.removeChild(div);
        return coordinates;
    };

    J.Editor = ({note, isOpen, mode, onClose, onSave, onLink}) => {
        const [txt,setTxt]=useState('');const [h,setH]=useState('');const [prev,setPrev]=useState(mode==='view');
        // Autocomplete State
        const [sug,setSug]=useState(false);const [sq,setSq]=useState('');const [sres,setSres]=useState([]);
        const [cPos,setCPos]=useState({top:0,left:0});const [trigIdx,setTrigIdx]=useState(-1);
        
        const ta=useRef(null); const prevRef=useRef(null); const conRef=useRef(null);
        const formatBuffer = useRef('');
        const formatTimeout = useRef(null);
        const { useClickOutside } = J.Hooks;

        // Initialize
        useEffect(()=>{
            if(note&&isOpen){
                setTxt(note.content||'');
                setPrev(mode==='view');
                setSug(false);
                setTimeout(()=>{
                    if(mode==='view') prevRef.current?.focus();
                    else if(ta.current) { ta.current.focus(); ta.current.setSelectionRange(ta.current.value.length,ta.current.value.length); }
                },100);
            }
        },[note?.id, isOpen]); // Only reset on note change or open

        // Markdown Parsing (Synchronous with marked v9)
        useEffect(()=>{
            const renderer = createRenderer({clickableCheckboxes:true});
            const html = marked.parse(txt||'',{breaks:true,gfm:true,renderer});
            setH(html);
        },[txt]);

        // Autocomplete Search
        useEffect(()=>{
            if(sug){
                const t=setTimeout(async()=>{
                    setSres(await searchNotes(sq)); 
                },150);
                return ()=>clearTimeout(t);
            }
        },[sq,sug]);

        const ins=(title)=>{
            const b=txt.slice(0,trigIdx);
            const a=txt.slice(ta.current.selectionEnd);
            const n=`${b}[[${title}]]${a}`;
            setTxt(n); setSug(false);
            setTimeout(()=>{
                if(ta.current){
                    ta.current.focus();
                    const p=trigIdx+2+title.length+2;
                    ta.current.setSelectionRange(p,p);
                }
            },50);
        };

        const handleChange=(e)=>{
            const v=e.target.value; setTxt(v);
            const c=e.target.selectionEnd;
            const lo=v.lastIndexOf('[[',c);
            if(lo!==-1){
                const tb=v.slice(lo+2,c);
                if(tb.includes(']]')||tb.includes('\n')){ setSug(false); }
                else {
                    setTrigIdx(lo); setSq(tb); setSug(true);
                    const coords=getCaretCoordinates(e.target,lo);
                    setCPos({top:coords.top-e.target.scrollTop,left:coords.left-e.target.scrollLeft});
                }
            } else { setSug(false); }
        };

        // --- Centralized Hook Usage ---
        const { useListNavigation } = J.Hooks;
        const { activeIndex: sidx, setActiveIndex: setSidx, listRef: sugListRef, handleKeyDown: handleAutocompleteKeyDown } = useListNavigation({
            isOpen: sug,
            itemCount: sres.length,
            onEnter: (index) => {
                if (sres[index]) ins(sres[index].title);
            },
            onEscape: () => setSug(false)
        });

        // Use the click-outside hook for the autocomplete dropdown
        const autocompleteDropdownRef = useClickOutside(sug, useCallback(() => setSug(false), []));

        const handleKeyDown=(e)=>{
            e.stopPropagation(); // Prevent global app listeners
            
            // Autocomplete
            if (sug) {
                // Pass event to the navigation hook. It will preventDefault if it handles the key.
                handleAutocompleteKeyDown(e);
                // If the hook handled it, we can stop.
                if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
                    return;
                }
            }

            // Formatting Shortcuts (Wrap/Unwrap Selection) with Delay
            if (ta.current && ta.current.selectionStart !== ta.current.selectionEnd) {
                if (['[', '*'].includes(e.key)) {
                    e.preventDefault();
                    const key = e.key;

                    // Reset buffer if key changes
                    if (formatBuffer.current.length > 0 && formatBuffer.current[0] !== key) {
                        formatBuffer.current = '';
                        if (formatTimeout.current) clearTimeout(formatTimeout.current);
                    }

                    formatBuffer.current += key;
                    if (formatTimeout.current) clearTimeout(formatTimeout.current);

                    formatTimeout.current = setTimeout(() => {
                        const buf = formatBuffer.current;
                        formatBuffer.current = '';
                        
                        if (!ta.current) return;

                        const start = ta.current.selectionStart;
                        const end = ta.current.selectionEnd;
                        const val = ta.current.value;
                        const selectedText = val.substring(start, end);
                        const before = val.substring(0, start);
                        const after = val.substring(end);
                        
                        let syntax = buf;
                        let closeSyntax = buf;

                        if (buf.startsWith('[')) closeSyntax = buf.replace(/\[/g, ']');

                        if (before.endsWith(syntax) && after.startsWith(closeSyntax)) {
                            const newBefore = before.substring(0, before.length - syntax.length);
                            const newAfter = after.substring(closeSyntax.length);
                            setTxt(newBefore + selectedText + newAfter);
                            setTimeout(() => { if(ta.current) { ta.current.focus(); ta.current.setSelectionRange(newBefore.length, newBefore.length + selectedText.length); } }, 0);
                        } else {
                            setTxt(before + syntax + selectedText + closeSyntax + after);
                            setTimeout(() => { if(ta.current) { ta.current.focus(); ta.current.setSelectionRange(start + syntax.length, end + syntax.length); } }, 0);
                        }
                    }, 200);
                    return;
                }
            }

            if(e.key==='Escape'){e.preventDefault();onClose();return;}
            
            // Ctrl+Enter (Toggle Edit)
            if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!e.shiftKey){
                e.preventDefault();
                if(prev) { setPrev(false); setTimeout(()=>ta.current?.focus(),50); }
                else onClose();
                return;
            }

            // Shift+Enter (Toggle View / Save)
            if(e.shiftKey&&e.key==='Enter'&&!e.ctrlKey){
                e.preventDefault();
                if(prev) onClose();
                else { 
                    (async () => { 
                        await onSave(note.id,txt); 
                        setPrev(true); setTimeout(()=>prevRef.current?.focus(),50); 
                    })(); 
                }
                return;
            }

            // Tab for indent/outdent
            if (e.key === 'Tab' && !prev && e.target === ta.current) {
                // The autocomplete hook already handles Tab when the suggestion box is open.
                // This check prevents indenting when trying to select an autocomplete item.
                if (sug) return;

                const val = ta.current.value;
                const start = ta.current.selectionStart;
                const before = val.substring(0, start);
                const lineStart = before.lastIndexOf('\n') + 1;
                const currentLine = val.substring(lineStart, val.indexOf('\n', start) === -1 ? val.length : val.indexOf('\n', start));

                // Only apply to lines that look like list items
                if (currentLine.trim().startsWith('-')) {
                    e.preventDefault();
                    let newVal, newCursorPos;
                    if (e.shiftKey) { // Outdent
                        newVal = val.substring(0, lineStart) + val.substring(lineStart + 2);
                        newCursorPos = Math.max(lineStart, start - 2);
                    } else { // Indent
                        newVal = val.substring(0, lineStart) + '  ' + val.substring(lineStart);
                        newCursorPos = start + 2;
                    }
                    setTxt(newVal);
                    setTimeout(() => { if (ta.current) { ta.current.selectionStart = ta.current.selectionEnd = newCursorPos; ta.current.focus(); } }, 0);
                    return;
                }
            }

            // List Continuation
            if(e.key==='Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !prev && e.target === ta.current){
                const val = ta.current.value;
                const start = ta.current.selectionStart;
                const end = ta.current.selectionEnd;
                const before = val.substring(0, start);
                const lineStart = before.lastIndexOf('\n') + 1;
                const currentLine = before.substring(lineStart);
                const match = currentLine.match(/^(\s*-\s)(.*)/);
                
                if(match){
                    e.preventDefault();
                    const prefix = match[1];
                    const content = match[2];
                    let newVal, newCursorPos;
                    
                    if(!content.trim()){
                        newVal = val.substring(0, lineStart) + '\n' + val.substring(end);
                        newCursorPos = lineStart + 1;
                    } else {
                        const insertion = '\n' + prefix;
                        newVal = val.substring(0, start) + insertion + val.substring(end);
                        newCursorPos = start + insertion.length;
                    }
                    setTxt(newVal);
                    setTimeout(()=>{ if(ta.current){ ta.current.selectionStart = ta.current.selectionEnd = newCursorPos; ta.current.focus(); } }, 0);
                    return;
                }
            }
        };

        const handlePreviewClick=(e)=>{
            if(e.target.classList.contains('internal-link')){
                e.preventDefault();
                onLink(e.target.dataset.title);
            }
            // Checkbox logic could go here
        };

        if(!isOpen||!note)return null;

        return html`
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick=${onClose}>
                <div ref=${conRef} tabIndex=${-1} onKeyDown=${handleKeyDown} onClick=${e => e.stopPropagation()} className="w-full max-w-[90vw] h-[90vh] bg-card rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 outline-none relative">
                    <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-background/50 rounded-t-lg">
                        <h2 className="text-xl font-bold truncate pr-4">${note.title}</h2>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick=${async ()=>{
                                if(prev){
                                    setPrev(false);setTimeout(()=>ta.current?.focus(),50);
                                }else{
                                    await onSave(note.id,txt);
                                    setPrev(true);setTimeout(()=>prevRef.current?.focus(),50);
                                }
                            }} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm min-w-[80px]">
                                ${prev?'Edit':'Preview'}
                            </button>
                            ${!prev&&html`<button onClick=${async ()=>{await onSave(note.id,txt);onClose()}} className="px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-80 text-sm">Save & Close</button>`}
                            <button onClick=${onClose} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 text-sm">Close</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden relative bg-background/50">
                        ${prev?html`
                            <div ref=${prevRef} tabIndex=${0} onClick=${handlePreviewClick} style=${{fontSize:'15px'}} className="w-full h-full p-6 overflow-auto prose dark:prose-invert max-w-none custom-scrollbar select-text outline-none compact-markdown" dangerouslySetInnerHTML=${{__html:h}} />
                        `:html`
                            <div className="relative w-full h-full">
                                <textarea ref=${ta} value=${txt} onChange=${handleChange} style=${{fontSize:'15px'}} className="w-full h-full p-6 bg-transparent resize-none outline-none font-mono custom-scrollbar" placeholder="Type markdown here... Use [[ to link." />
                                ${sug&&html`
                                    <div ref=${(el) => { autocompleteDropdownRef.current = el; sugListRef.current = el; }} className="absolute z-50 w-64 bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-md max-h-60 overflow-y-auto custom-scrollbar" style=${{top:cPos.top+30,left:cPos.left+24}}>
                                        ${sres.length===0?html`<div className="p-2 text-xs text-gray-500 italic">No matching notes</div>`
                                        :sres.map((s,i)=>html`
                                            <div key=${s.id} onClick=${()=>ins(s.title)} onMouseEnter=${() => setSidx(i)} className=${`px-3 py-2 text-sm cursor-pointer ${i===sidx?'bg-primary text-primary-foreground':'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                ${s.title}
                                            </div>
                                        `)}
                                    </div>
                                `}
                            </div>
                        `}
                    </div>
                    <div className="p-2 text-xs text-gray-500 border-t dark:border-gray-700 text-center bg-background/50 rounded-b-lg">
                        ${prev?'View Mode • Ctrl+Enter: Edit • Shift+Enter: Close • Esc: Close':'Edit Mode • [[ for links • Shift+Enter: Save & View • Ctrl+Enter: Cancel & Close • Esc: Cancel'}
                    </div>
                </div>
            </div>
        `;
    };
})(window.Jaroet);
