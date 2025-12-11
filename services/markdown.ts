
import { marked } from 'marked';

// --- Shared Link Renderer Logic ---
const linkRenderer = function(hrefOrObj: string | { href: string; title?: string; text: string }, title?: string | null, text?: string) {
    let href: string = '';
    let linkTitle: string | null | undefined = title;
    let linkText: string = text || '';

    if (typeof hrefOrObj === 'object') {
        href = hrefOrObj.href;
        linkTitle = hrefOrObj.title;
        linkText = hrefOrObj.text;
    } else {
        href = hrefOrObj;
    }

    const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    const titleAttr = linkTitle ? ` title="${linkTitle}"` : '';
    
    let output = `<a href="${href}"${titleAttr}${targetAttr}>${linkText}`;
    
    if (isExternal) {
        output += '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ml-0.5 opacity-70 mb-0.5 align-baseline"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    }
    
    output += '</a>';
    return output;
};

// --- Shared WikiLink Extension ---
export const wikiLinkExtension = {
    name: 'wikiLink',
    level: 'inline',
    start(src: string) { return src.match(/\[\[/)?.index; },
    tokenizer(src: string) {
        const rule = /^\[\[([^\]]+)\]\]/;
        const match = rule.exec(src);
        if (match) {
            const inner = match[1];
            const parts = inner.split('|');
            const title = parts[0].trim();
            const alias = parts.length > 1 ? parts.slice(1).join('|').trim() : title;
            return {
                type: 'wikiLink',
                raw: match[0],
                title: title,
                alias: alias
            };
        }
    },
    renderer(token: any) {
        return `<a class="internal-link text-primary hover:underline cursor-pointer" data-title="${token.title}">${token.alias}</a>`;
    }
};

// --- Factory for Renderers ---
export const createRenderer = (options: { clickableCheckboxes: boolean }) => {
    const renderer = new marked.Renderer();
    renderer.link = linkRenderer;
    
    if (options.clickableCheckboxes) {
        renderer.checkbox = function(checked) {
            return `<input type="checkbox" ${checked ? 'checked="" ' : ''} class="task-list-item-checkbox" style="cursor: pointer; margin-right: 0.6em; vertical-align: middle;">`;
        };
    } else {
        renderer.checkbox = function(checked) {
            return `<input type="checkbox" ${checked ? 'checked="" ' : ''} class="task-list-item-checkbox" disabled style="margin-right: 0.6em; vertical-align: middle;">`;
        };
    }
    
    return renderer;
};
