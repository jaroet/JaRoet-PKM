
(function(J) {
    const { useState, useCallback } = React;

    J.Hooks.useHistory = (init) => {
        const [h,setH]=useState(init?[init]:[]);const [i,setI]=useState(init?0:-1);
        
        const visit=useCallback((id)=>{
            setH(p=>{
                // If visiting same note, do nothing
                if(p[i]===id) return p;
                
                // Slice forward history, push new
                const n=p.slice(0,i+1);
                n.push(id);
                
                // Max history limit
                if(n.length>50) n.shift();
                return n;
            });
            // Update index
            setI(p=>{
                const l=i+2>50?49:i+1; 
                return l;
            }); 
        },[i]);

        return {
            currentId: i>=0?h[i]:null,
            visit,
            replace:(id)=>{setH([id]);setI(0);},
            back:()=>i>0&&setI(i-1),
            forward:()=>i<h.length-1&&setI(i+1),
            canBack:i>0,
            canForward:i<h.length-1
        };
    };
})(window.Jaroet);
