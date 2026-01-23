// ==UserScript==
// @name         Expert Editor Universal TinyMCE - ULTIMATE V5.4.8
// @namespace    https://github.com/Steven17200
// @version      5.4.8
// @description  RÉTABLISSEMENT DES PUCES : IA + US + Analyse + Table + T8 + Petit + Music + SC + Shorts + YouTube Pixels
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
        if (!text || text.trim().length < 5) {
            alert(fullContent ? "L'éditeur est vide !" : "Veuillez d'abord surligner du texte.");
            return;
        }

        const originalLabel = btn.innerHTML;
        btn.innerHTML = '⏳';
        btn.style.color = "#ffb300";

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://api.mistral.ai/v1/chat/completions",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + MISTRAL_API_KEY
            },
            data: JSON.stringify({
                model: "open-mistral-7b",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                temperature: 0.7
            }),
            onload: function(response) {
                try {
                    let data = JSON.parse(response.responseText);
                    let result = data.choices[0].message.content.trim();
                    ed.focus();
                    if (fullContent) {
                        let finalHtml = result
                            .replace(/[*_#~]/g, "")
                            .replace(/\n\s*\n/g, '\n')
                            .split('\n')
                            .map(line => {
                                if (line.includes('<h2') || line.includes('<h3')) return line;
                                return `<p style="margin: 0 0 4px 0; line-height: 1.3;">${line}</p>`;
                            })
                            .join('');
                        ed.setContent(finalHtml);
                    } else {
                        ed.execCommand('mceInsertContent', false, result);
                    }
                    btn.innerHTML = '✅';
                    btn.style.color = "#27ae60";
                } catch(e) {
                    btn.innerHTML = '❌';
                    btn.style.color = "#e74c3c";
                }
                setTimeout(() => {
                    btn.innerHTML = originalLabel;
                    btn.style.color = (finalLabel === 'US') ? '#ffb300' : (finalLabel === '🧐 Analyse') ? '#3498db' : '#000';
                }, 2000);
            }
        });
    }

    function init() {
        if (typeof tinyMCE !== 'undefined' && tinyMCE.editors && tinyMCE.editors.length > 0) {
            tinyMCE.editors.forEach(setupEditor);
        } else { setTimeout(init, 1000); }
    }

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
            btn.onclick = onClick;
            return btn;
        };

        // --- BLOC IA & ANALYSE ---
        toolbar.appendChild(create('btn-ai-corr', '✨ IA', () => { appelMistral(ed, document.getElementById('btn-ai-corr'), "Corrige l'orthographe.", '✨ IA'); }));

        const usBtn = create('btn-ai-us', 'US', () => { appelMistral(ed, usBtn, "Translate to Texan English.", 'US'); });
        usBtn.style.color = "#ffb300";
        toolbar.appendChild(usBtn);

        const analyzeBtn = create('btn-ai-analyze', '🧐 Analyse', () => {
            const promptAnalyse = `Tu es rédacteur magazine expert. Identifie l'auteur.
            1. POLITESSES : Remercie l'auteur au début : <span style='background-color: #3498db; color: white; padding: 3px 8px; border-radius: 5px; font-weight: bold;'>@Auteur</span>.
            2. ANALYSE : Fais une analyse complète, structurée et approfondie.
            3. TITRE : Centré, fond anthracite (#333), texte blanc : <h2 style='text-align: center; background: #333; color: white; padding: 10px; border-radius: 4px; font-weight: bold;'>TITRE</h2>
            4. CITATIONS : Surligne en bleu clair avec style Humain : <span style='background-color: #e3f2fd; padding: 4px; font-family: "Comic Sans MS", cursive;'>@Auteur a dit : "..."</span>.
            5. MARQUES : Netflix en rouge, TF1 en bleu, Orange en orange. Rouge pour les alertes, vert pour le positif.
            6. MON AVIS : <h3 style='text-align: center;'>Mon avis en tant que IA (Mistral)</h3>. Style Humain obligatoire pour ton avis.`;
            appelMistral(ed, analyzeBtn, promptAnalyse, '🧐 Analyse', true);
        });
        analyzeBtn.style.color = "#3498db";
        toolbar.appendChild(analyzeBtn);

        // --- BLOC ÉDITION ---
        const sizeSelect = document.createElement('select');
        sizeSelect.style = "padding: 3px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px;";
        ['8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt', '48pt', '72pt'].forEach(s => {
            const o = document.createElement('option'); o.value = s; o.innerHTML = s;
            if(s === '12pt') o.selected = true;
            sizeSelect.appendChild(o);
        });
        sizeSelect.onchange = () => { ed.focus(); ed.execCommand('FontSize', false, sizeSelect.value); };
        toolbar.appendChild(sizeSelect);

        // RÉTABLISSEMENT DES LISTES
        toolbar.appendChild(create('btn-list-num', '1.', () => { ed.focus(); ed.execCommand('InsertOrderedList'); }));
        toolbar.appendChild(create('btn-list-bull', '•', () => { ed.focus(); ed.execCommand('InsertUnorderedList'); }));
        toolbar.appendChild(create('btn-ident', '➡ Ident', () => { ed.focus(); ed.execCommand('Indent'); }));

        toolbar.appendChild(create('btn-grid', '📅 Table', () => {
            const r = prompt("Lignes :", "3"), c = prompt("Colonnes :", "3");
            if (r && c) {
                let h = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ccc; margin: 10px 0;">';
                for (let i = 0; i < r; i++) {
                    h += '<tr>';
                    for (let j = 0; j < c; j++) { h += `<td style="padding: 8px; border: 1px solid #ccc;">Cellule</td>`; }
                    h += '</tr>';
                }
                ed.focus(); ed.execCommand('mceInsertContent', false, h + '</table><p></p>');
            }
        }));

        toolbar.appendChild(create('btn-font-tr', 'TR', () => { ed.focus(); const s = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="color:#ff4500; font-family:Impact; text-transform:uppercase; font-style:italic;">${s || 'TR'}</span>`); }));
        toolbar.appendChild(create('btn-font-t8', 'T8', () => { ed.focus(); const s = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="color:#ff0000; font-family:monospace; font-weight:bold; text-shadow:0 0 5px red;">${s || 'T8'}</span>`); }));
        toolbar.appendChild(create('btn-font-humain', 'Humain', () => { ed.focus(); const s = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="font-family:'Comic Sans MS', cursive, sans-serif;">${s || 'Texte'}</span>`); }));
        toolbar.appendChild(create('btn-font-small', 'Petit', () => { ed.focus(); const s = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="font-size: 8pt;">${s || 'Petit'}</span>`); }));

        const cols = [{n:'N',c:'#000'},{n:'R',c:'#e74c3c'},{n:'B',c:'#3498db'},{n:'V',c:'#27ae60'},{n:'O',c:'#ff9800'},{n:'VI',c:'#8e44ad'},{n:'BL',c:'#fff'}];
        cols.forEach(col => { toolbar.appendChild(create('btn-col-'+col.n, col.n, () => { ed.focus(); ed.execCommand('ForeColor', false, col.c); })); });

        // --- BLOC MÉDIAS ---
        toolbar.appendChild(create('btn-yt-video', '📺 YouTube', () => {
            const url = prompt("Lien YouTube :");
            const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
            if(id){
                const w = prompt("Largeur (pixels) :", "560");
                const h = prompt("Hauteur (pixels) :", "315");
                ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:10px 0;"><iframe width="${w}" height="${h}" src="https://www.youtube.com/embed/${id}" frameborder="0" style="border-radius:12px; background:#000;"></iframe></div><p></p>`);
            }
        }));

        toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
            const url = prompt("Lien Music :");
            const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}"></iframe>`); }
        }));

        toolbar.appendChild(create('btn-sc', '☁️ SC', () => {
            const url = prompt("Lien SoundCloud :");
            if(url){ ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="120" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}"></iframe>`); }
        }));

        toolbar.appendChild(create('btn-yt-shorts', '🎬 SHORTS', () => {
            const url = prompt("Lien Short :");
            const id = url ? url.match(/(?:\/shorts\/|v=)([\w-]+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:10px 0;"><iframe width="315" height="560" src="https://www.youtube.com/embed/${id}" frameborder="0" style="border-radius:12px; background:#000;"></iframe></div>`); }
        }));

        container.insertBefore(toolbar, container.firstChild);
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
