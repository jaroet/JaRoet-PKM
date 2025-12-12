
(function(J) {
    const linkRenderer = (hrefOrObj, title, text) => {
        let href = '';
        let linkTitle = title;
        let linkText = text || '';

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
        if (isExternal) output += '<span style="display:inline-block; margin-left:2px; opacity:0.7; font-size:0.7em;">↗</span>';
        output += '</a>';
        return output;
    };

    const wikiLinkExtension = {
        name: 'wikiLink',
        level: 'inline',
        start(src) { return src.match(/\[\[/)?.index; },
        tokenizer(src) {
            const rule = /^\[\[([^\]]+)\]\]/;
            const match = rule.exec(src);
            if (match) {
                const inner = match[1];
                const parts = inner.split('|');
                const title = parts[0].trim();
                const alias = parts.length > 1 ? parts.slice(1).join('|').trim() : title;
                return { type: 'wikiLink', raw: match[0], title: title, alias: alias };
            }
        },
        renderer(token) {
            return `<a class="internal-link text-primary hover:underline cursor-pointer" data-title="${token.title}">${token.alias}</a>`;
        }
    };

    const createRenderer = (options) => {
        const renderer = new marked.Renderer();
        renderer.link = linkRenderer;
        renderer.checkbox = (checked) => {
            const attr = options.clickableCheckboxes ? '' : 'disabled';
            const cursor = options.clickableCheckboxes ? 'cursor: pointer;' : '';
            return `<input type="checkbox" ${checked ? 'checked="" ' : ''} class="task-list-item-checkbox" ${attr} style="${cursor} margin-right: 0.6em; vertical-align: middle;">`;
        };
        return renderer;
    };

    J.Services.Markdown = {
        createRenderer,
        wikiLinkExtension
    };

})(window.Jaroet);
