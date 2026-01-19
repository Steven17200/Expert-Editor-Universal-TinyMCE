// ==UserScript==
// @name         Expert Editor Universal TinyMCE - ULTIMATE V4.9.0
// @namespace    https://github.com/Steven17200
// @version      4.9.0
// @description  Version Totale : Correcteur IA Mistral + YT Music + Tailles + Styles + Couleurs + Shorts + Tableau + Listes & Sous-catégories
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.mistral.ai
// ==/UserScript==

(function() {
    'use strict';

    const MISTRAL_API_KEY = 'YOUR KEY';

    // --- LOGIQUE API MISTRAL ---
    function appelMistralTiny(ed, btn, systemPrompt, finalLabel) {
        let text = ed.getContent({ format: 'text' });
        if (!text || text.trim().length < 2) return;

        btn.innerText = '⏳';
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
                temperature: 0
            }),
            onload: function(response) {
                try {
                    let data = JSON.parse(response.responseText);
                    let rawRes = data.choices[0].message.content;
                    let cleanText = rawRes.replace(/^(Line 1|Ligne 1|Translation|Traduction|Texte|Resultat)\s*:?\s*/i, "").replace(/^["']|["']$/g, "").trim();

                    ed.focus();
                    ed.setContent(cleanText);
                    btn.innerText = '✅';
                    btn.style.color = "#27ae60";
                } catch(e) {
                    btn.innerText = '❌';
                    btn.style.color = "#e74c3c";
                }
                setTimeout(() => { btn.innerText = finalLabel; btn.style.color = "#000"; }, 2000);
            }
        });
    }

    const TEMPLATES = {
        1: `<div style="border-left: 5px solid #3498db; background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; color: #2c3e50;"><strong style="color: #2980b9;">ℹ️ INFO :</strong> Votre texte ici...</div>`,
        2: `<div style="border: 2px solid #e74c3c; background: #fdf2f2; padding: 15px; margin: 10px 0; border-radius: 4px; color: #c0392b;"><strong>⚠️ ALERTE :</strong> Message important...</div>`,
        3: `<table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;"><tr style="background:#eee;"><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Titre 1</td><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Titre 2</td></tr><tr><td style="padding:8px; border:1px solid #ddd;">Donnée 1</td><td style="padding:8px; border:1px solid #ddd;">Donnée 2</td></tr></table>`
    };

    function init() {
        if (typeof tinyMCE !== 'undefined' && tinyMCE.editors && tinyMCE.editors.length > 0) {
            tinyMCE.editors.forEach(setupEditor);
        } else {
            setTimeout(init, 1000);
        }
    }

    function setupEditor(ed) {
        if (!ed.getContainer() || ed.getContainer().querySelector('.expert-editor-toolbar')) return;

        const container = ed.getContainer();
        if (container) {
            const toolbar = document.createElement('div');
            toolbar.className = 'expert-editor-toolbar';
            toolbar.style = "background: #f1f1f1; border-bottom: 1px solid #ccc; padding: 5px; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; justify-content: flex-start; z-index: 9999;";

            const create = (id, text, onClick) => {
                const btn = document.createElement('button');
                btn.id = id; btn.innerHTML = text; btn.type = 'button';
                btn.style = "padding: 4px 8px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; font-family: sans-serif; color: #000;";
                btn.onclick = onClick;
                return btn;
            };

            // --- NOUVEAU : CORRECTEUR IA ---
            const aiBtn = create('btn-ai-fix', '✨ IA Fix', () => {
                appelMistralTiny(ed, aiBtn, "Corrige l'orthographe et la grammaire française. Répondre UNIQUEMENT avec le texte corrigé.", '✨ IA Fix');
            });
            toolbar.appendChild(aiBtn);

            // --- 1. TAILLE DE POLICE ---
            const sizeSelect = document.createElement('select');
            sizeSelect.style = "padding: 3px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; font-size: 12px;";
            ['6pt', '8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt', '48pt', '72pt'].forEach(s => {
                const o = document.createElement('option'); o.value = s; o.innerHTML = s;
                if(s === '12pt') o.selected = true;
                sizeSelect.appendChild(o);
            });
            sizeSelect.onchange = () => { ed.focus(); ed.execCommand('FontSize', false, sizeSelect.value); };
            toolbar.appendChild(sizeSelect);

            // --- 2. LISTES ET SOUS-CATÉGORIES ---
            toolbar.appendChild(create('btn-list-num', '1.', () => { ed.focus(); ed.execCommand('InsertOrderedList'); }));
            toolbar.appendChild(create('btn-list-bull', '•', () => { ed.focus(); ed.execCommand('InsertUnorderedList'); }));
            toolbar.appendChild(create('btn-indent', '➡ Ident', () => { ed.focus(); ed.execCommand('Indent'); }));

            // --- 3. MODÈLES ET TABLEAU ---
            toolbar.appendChild(create('btn-tpl-1', 'Info', () => { ed.focus(); ed.execCommand('mceInsertContent', false, TEMPLATES[1]); }));
            toolbar.appendChild(create('btn-tpl-2', 'Alerte', () => { ed.focus(); ed.execCommand('mceInsertContent', false, TEMPLATES[2]); }));
            toolbar.appendChild(create('btn-grid', '📅 Table', () => {
                const rows = prompt("Lignes :", "3"), cols = prompt("Colonnes :", "3");
                if (rows && cols) {
                    let h = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ccc; margin: 10px 0;">';
                    for (let r = 0; r < rows; r++) {
                        h += '<tr>';
                        for (let c = 0; c < cols; c++) {
                            const isH = r === 0;
                            h += `<td style="padding: 8px; border: 1px solid #ccc; ${isH ? 'background: #f2f2f2; font-weight: bold;' : ''}">Cellule</td>`;
                        }
                        h += '</tr>';
                    }
                    ed.focus(); ed.execCommand('mceInsertContent', false, h + '</table><p></p>');
                }
            }));

            // --- 4. STYLES SPÉCIAUX (REMIS À NEUF) ---
            toolbar.appendChild(create('btn-font-tr', 'TR', () => { ed.focus(); const sel = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="color:#ff4500; font-family:Impact; text-transform:uppercase; font-style:italic;">${sel || 'TR'}</span>`); }));
            toolbar.appendChild(create('btn-font-t8', 'T8', () => { ed.focus(); const sel = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="color:#ff0000; font-family:monospace; font-weight:bold; text-shadow:0 0 5px red;">${sel || 'T8'}</span>`); }));
            toolbar.appendChild(create('btn-font-humain', 'Humain', () => { ed.focus(); const sel = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="font-family:'Comic Sans MS', cursive, sans-serif;">${sel || 'Texte'}</span>`); }));
            toolbar.appendChild(create('btn-font-small', 'Petit', () => { ed.focus(); const sel = ed.selection.getContent(); ed.execCommand('mceInsertContent', false, `<span style="font-size: 8pt;">${sel || 'Petit'}</span>`); }));

            // --- 5. COULEURS (REMISES À NEUF) ---
            const cols = [{n:'N',c:'#000'},{n:'R',c:'#e74c3c'},{n:'B',c:'#3498db'},{n:'V',c:'#27ae60'},{n:'O',c:'#ff9800'},{n:'VI',c:'#8e44ad'},{n:'VF',c:'#1b5e20'},{n:'BF',c:'#0d47a1'},{n:'BL',c:'#fff'}];
            cols.forEach(col => {
                const b = create('btn-col-'+col.n, col.n, () => { ed.focus(); ed.execCommand('ForeColor', false, col.c); });
                if(col.n === 'BL') b.style.border = "1px solid #aaa";
                toolbar.appendChild(b);
            });

            // --- 6. MÉDIAS (YT, MUSIC, SC, SHORTS) ---
            toolbar.appendChild(create('btn-yt-std', '📺 YT', () => {
                const url = prompt("Lien YT :");
                const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
                if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`); }
            }));
            toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
                const url = prompt("Lien YT Music :");
                const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
                if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="margin:10px 0;"><iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}?controls=1" frameborder="0" style="border-radius:8px; background:#000;"></iframe></div><p></p>`); }
            }));
            toolbar.appendChild(create('btn-sc', '☁️ SC', () => {
                const url = prompt("Lien SoundCloud :");
                if(url){ ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="120" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}"></iframe><p></p>`); }
            }));
            toolbar.appendChild(create('btn-yt-shorts', '🎬 SHORTS', () => {
                const url = prompt("Lien Short :");
                const id = url ? url.match(/(?:\/shorts\/|v=)([\w-]+)/)?.[1] : null;
                if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center;"><iframe width="315" height="560" src="https://www.youtube.com/embed/${id}" style="border-radius:12px; background:#000;"></iframe></div>`); }
            }));

            container.insertBefore(toolbar, container.firstChild);
        }
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
