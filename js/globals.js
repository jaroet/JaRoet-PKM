
/* 
 * JaRoet PKM Globals
 * Sets up the Jaroet namespace and binds HTM to React.
 */

window.Jaroet = {
    Services: {},
    Components: {},
    Hooks: {},
    APP_VERSION: '0.3.17'
};

// Bind HTM to React.createElement
// This allows us to use `html` tagged templates instead of JSX
window.html = htm.bind(React.createElement);

// Polyfill for randomUUID in older environments
if(typeof crypto==='undefined')window.crypto={};
if(!window.crypto.randomUUID){window.crypto.randomUUID=function(){return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c=='x'?r:(r&0x3|0x8);return v.toString(16)})}};
