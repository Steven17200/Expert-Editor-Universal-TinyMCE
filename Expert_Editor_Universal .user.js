// ==UserScript==
// @name         Expert Editor Universal TinyMCE - ULTIMATE V5.7.7
// @namespace    https://github.com/Steven17200
// @version      5.7.7
// @description  AJOUT PRÉSENTATION + PETIT + TABLE + HUMAIN | GARDE TOUT VOTRE CODE V5.7.5
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.mistral.ai
// ==/UserScript==

(function() {
    'use strict';

    const MISTRAL_API_KEY = 'KEY API';

    function appelMistral(ed, btn, systemPrompt, finalLabel, fullContent = false) {
        let text = fullContent ? ed.getContent({ format: 'text' }) : ed.selection.getContent({ format: 'text' });
        if (!text || text.trim().length < 5) { alert("Sélectionnez du texte !"); return; }
        const originalLabel = btn.innerHTML;
        btn.innerHTML = '⏳';
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://api.mistral.ai/v1/chat/completions",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + MISTRAL_API_KEY },
            data: JSON.stringify({
                model: "open-mistral-7b",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
                temperature: 0.7
            }),
            onload: function(response) {
                try {
                    let data = JSON.parse(response.responseText);
                    let result = data.choices[0].message.content.trim();
                    ed.focus();
                    if (fullContent) {
                        let finalHtml = result.replace(/[*_#~]/g, "")
                            .split('\n').filter(line => line.trim() !== "").map(line => {
                                if (line.includes('<h2') || line.includes('<h3') || line.includes('<span') || line.includes('<div')) return line;
                                return `<p style="margin: 12px 0; line-height: 1.6; font-size: 11pt;">${line}</p>`;
                            }).join('');
                        ed.setContent(finalHtml);
                    } else { ed.execCommand('mceInsertContent', false, result); }
                    btn.innerHTML = '✅';
                } catch(e) { btn.innerHTML = '❌'; }
                setTimeout(() => { btn.innerHTML = originalLabel; }, 2000);
            }
        });
    }

    function init() { if (typeof tinyMCE !== 'undefined' && tinyMCE.editors && tinyMCE.editors.length > 0) { tinyMCE.editors.forEach(setupEditor); } else { setTimeout(init, 1000); } }

    function setupEditor(ed) {
        if (!ed.getContainer() || ed.getContainer().querySelector('.expert-editor-toolbar')) return;
        const container = ed.getContainer();
        const toolbar = document.createElement('div');
        toolbar.className = 'expert-editor-toolbar';
        toolbar.style = "background: #f1f1f1; border-bottom: 1px solid #ccc; padding: 5px; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; z-index: 9999;";

        const create = (id, text, onClick) => {
            const btn = document.createElement('button');
            btn.id = id; btn.innerHTML = text; btn.type = 'button';
            btn.style = "padding: 4px 8px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; font-family: sans-serif; color: #000; font-weight: bold;";
            btn.onclick = onClick; return btn;
        };

        // --- IA & ANALYSE ---
        toolbar.appendChild(create('btn-ai-corr', '✨ IA', () => { appelMistral(ed, document.getElementById('btn-ai-corr'), "Corrige l'orthographe.", '✨ IA'); }));
        const usBtn = create('btn-ai-us', 'US', () => { appelMistral(ed, usBtn, "Translate to Texan English.", 'US'); });
        usBtn.style.color = "#ffb300"; toolbar.appendChild(usBtn);

        // AJOUT : BOUTON PRÉSENTATION
        toolbar.appendChild(create('btn-presentation', '📢 Présentation', () => {
            ed.focus();
            ed.execCommand('mceInsertContent', false, " (expérimentation) Bonjour, je suis Mistral, l'IA");
        }));

        toolbar.appendChild(create('btn-ai-analyze', '🧐 Analyse', () => {
            const promptMistral = `Tu es un technicien réseau aguerri, spécialiste dans les telecom  : Remercie @Auteur 'a écrit' pour son message et en citant son texte après 'a écrit' : Analyse son propos (points forts/faibles, précisions techniques).et Donne juste ton avis d’expert (exemples concrets, comparaisons, données historiques si pertinent). et Termine par une question ouverte ou une suggestion. **Style** : direct, technique mais accessible, sans formules creuses. **Format** : 3-5 phrases max par point.`;
            appelMistral(ed, document.getElementById('btn-ai-analyze'), promptMistral, '🧐 Analyse', true);
        }));

        // --- TAILLES & POLICES ---
        const sizeSelect = document.createElement('select');
        ['6pt', '8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt', '48pt', '72pt'].forEach(s => {
            const o = document.createElement('option'); o.value = s; o.innerHTML = s; if(s === '12pt') o.selected = true; sizeSelect.appendChild(o);
        });
        sizeSelect.onchange = () => { ed.focus(); ed.execCommand('FontSize', false, sizeSelect.value); };
        toolbar.appendChild(sizeSelect);

        const fontSelect = document.createElement('select');
        const fonts = [{n:'Police...', v:''},{n:'Arial', v:'Arial'},{n:'Verdana', v:'Verdana'},{n:'Comic Sans', v:'"Comic Sans MS"'},{n:'Caveat', v:'"Caveat"'},{n:'Impact', v:'Impact'},{n:'Courier', v:'"Courier New"'}];
        fonts.forEach(f => { const o = document.createElement('option'); o.value = f.v; o.innerHTML = f.n; fontSelect.appendChild(o); });
        fontSelect.onchange = () => { ed.focus(); ed.execCommand('FontName', false, fontSelect.value); };
        toolbar.appendChild(fontSelect);

        // --- ÉDITION & ALERTE ---
        toolbar.appendChild(create('btn-list-num', '1.', () => { ed.focus(); ed.execCommand('InsertOrderedList'); }));
        toolbar.appendChild(create('btn-list-bull', '•', () => { ed.focus(); ed.execCommand('InsertUnorderedList'); }));
        toolbar.appendChild(create('btn-ident', '➡ Ident', () => { ed.focus(); ed.execCommand('Indent'); }));

        toolbar.appendChild(create('btn-grid', '📅 Table', () => {
            const r = prompt("Lignes :", "3"), c = prompt("Colonnes :", "3");
            if (r && c) {
                let h = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ccc; margin: 10px 0;">';
                for(let i=0; i<r; i++){ h += '<tr>'; for(let j=0; j<c; j++) h += '<td style="padding:8px; border:1px solid #ccc;">Cellule</td>'; h += '</tr>'; }
                ed.focus(); ed.execCommand('mceInsertContent', false, h + '</table><p></p>');
            }
        }));

        toolbar.appendChild(create('btn-alert', '📢 Alerte', () => {
            const s = ed.selection.getContent();
            ed.execCommand('mceInsertContent', false, `<div style="background:#fee2e2; border:2px solid #ef4444; padding:15px; border-radius:8px; color:#991b1b; font-weight:bold; margin:10px 0;">⚠️ ALERTE : ${s || '...'}</div><p></p>`);
        }));
        toolbar.appendChild(create('btn-font-tr', 'TR', () => { const s = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="color:#ff4500; font-family:Impact; text-transform:uppercase; font-style:italic;">${s || 'TR'}</span>`); }));
        toolbar.appendChild(create('btn-font-t8', 'T8', () => { const s = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="color:#ff0000; font-family:monospace; font-weight:bold; text-shadow:0 0 5px red;">${s || 'T8'}</span>`); }));

        toolbar.appendChild(create('btn-font-humain', 'Humain', () => { const s = ed.selection.getContent(); ed.focus(); ed.execCommand('mceInsertContent', false, `<span style="font-family:'Comic Sans MS', cursive;">${s || 'Texte'}</span>`); }));
        toolbar.appendChild(create('btn-font-small', 'Petit', () => { const s = ed.selection.getContent(); ed.focus(); ed.execCommand('mceInsertContent', false, `<span style="font-size: 8pt;">${s || 'Petit'}</span>`); }));

        // --- COULEURS T/S ---
        const cols = [{n:'N',c:'#000'},{n:'R',c:'#e74c3c'},{n:'B',c:'#3498db'},{n:'V',c:'#27ae60'},{n:'O',c:'#ff9800'}];
        cols.forEach(col => { toolbar.appendChild(create('btn-col-'+col.n, col.n, () => { ed.focus(); ed.execCommand('ForeColor', false, col.c); })); });
        const cpT = document.createElement('input'); cpT.type = 'color'; cpT.title = "Texte"; cpT.style = "width:25px; height:25px; cursor:pointer;";
        cpT.onchange = () => { ed.focus(); ed.execCommand('ForeColor', false, cpT.value); };
        toolbar.appendChild(document.createTextNode(" T:")); toolbar.appendChild(cpT);
        const cpS = document.createElement('input'); cpS.type = 'color'; cpS.value = '#ffff00'; cpS.title = "Surlignage"; cpS.style = "width:25px; height:25px; cursor:pointer;";
        cpS.onchange = () => { ed.focus(); ed.execCommand('HiliteColor', false, cpS.value); };
        toolbar.appendChild(document.createTextNode(" S:")); toolbar.appendChild(cpS);

        // --- MÉDIAS ---
        toolbar.appendChild(create('btn-yt-video', '📺 YouTube', () => {
            const url = prompt("Lien YouTube :");
            const id = url ? url.match(/(?:v=|\/|shorts\/)([\w-]+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:15px 0;"><iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:12px; background:#000;"></iframe></div><p></p>`); }
        }));
        toolbar.appendChild(create('btn-yt-shorts', '🎬 SHORTS', () => {
            const url = prompt("Lien Short :");
            const id = url ? url.match(/(?:\/shorts\/|v=)([\w-]+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:15px 0;"><iframe width="315" height="560" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:12px; background:#000;"></iframe></div><p></p>`); }
        }));
        toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
            const url = prompt("Lien YouTube Music :");
            const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="margin:10px 0;"><iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}" frameborder="0" style="border-radius:8px; background:#000;"></iframe></div><p></p>`); }
        }));
        toolbar.appendChild(create('btn-odysee', '🚀 Odysee', () => {
            const url = prompt("Lien MP4 :");
            if(url){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:15px 0;"><video width="560" height="315" controls muted style="border-radius:12px; background:#000;" onmouseover="this.play()" onmouseout="this.pause();"><source src="${url}" type="video/mp4"></video></div><p></p>`); }
        }));
        toolbar.appendChild(create('btn-sc', '☁️ SC', () => {
            const url = prompt("Lien SoundCloud :");
            if(url){ ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}"></iframe><p></p>`); }
        }));

        container.insertBefore(toolbar, container.firstChild);
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
