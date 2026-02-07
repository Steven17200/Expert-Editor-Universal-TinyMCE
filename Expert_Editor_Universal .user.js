// ==UserScript==
// @name         Expert Editor Universal - ULTIMATE V5.9.4
// @namespace    https://github.com/Steven17200
// @version      5.9.4
// @description  CONSERVATION STRICTE V5.9.3 + AJOUT MENU SURLIGNAGE COULEURS
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      api.mistral.ai
// ==/UserScript==

(function() {
    'use strict';

    // Importation des polices Google : SF, Machine, et le nouveau pack "Écritures Attachées"
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Caveat:wght@400;700&family=Pacifico&family=Dancing+Script:wght@400;700&family=Shadows+Into+Light&family=Michroma&family=Special+Elite&family=Homemade+Apple&family=Yellowtail&family=Satisfy&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const MISTRAL_API_KEY = 'z6hnb44CCvYe0sqazH3PrJLFC3PFGPkp';

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
        toolbar.appendChild(create('btn-presentation', '📢 Présentation', () => {
            ed.focus(); ed.execCommand('mceInsertContent', false, " (Script expérimentale) Bonjour, je suis Mistral ✨, l'IA Française");
        }));
        toolbar.appendChild(create('btn-ai-analyze', '🧐 Analyse', () => {
            const promptMistral = `Analyse en profondeur les implications de l'article, Structure ta réponse en 3 parties : contexte, arguments pour/contre, conclusion. et donne-moi des chiffres concernant le secteur professionnel et particulier. Fais-moi... une proposition la plus pertinente possible.`;
            appelMistral(ed, document.getElementById('btn-ai-analyze'), promptMistral, '🧐 Analyse', true);
        }));

        // --- TAILLES ---
        const sizeSelect = document.createElement('select');
        ['6pt', '8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt', '48pt', '72pt'].forEach(s => {
            const o = document.createElement('option'); o.value = s; o.innerHTML = s; if(s === '12pt') o.selected = true; sizeSelect.appendChild(o);
        });
        sizeSelect.onchange = () => { ed.focus(); ed.execCommand('FontSize', false, sizeSelect.value); };
        toolbar.appendChild(sizeSelect);

        // --- MENU POLICES ---
        const fontSelect = document.createElement('select');
        fontSelect.style = "padding: 3px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; max-width: 150px;";
        const fonts = [
            {n:'Choix Police...', v:''},
            {n:'-- ÉCRITURE ATTACHÉE --', v:'Yellowtail'},
            {n:'Yellowtail (Fluide)', v:'Yellowtail, cursive'},
            {n:'Satisfy (Plume)', v:'Satisfy, cursive'},
            {n:'Dancing Script (Cursive)', v:'"Dancing Script", cursive'},
            {n:'-- MANUSCRITE / STYLO --', v:'Caveat'},
            {n:'Caveat (Feutre)', v:'Caveat, cursive'},
            {n:'Shadow Light (Note)', v:'"Shadows Into Light", cursive'},
            {n:'Homemade Apple (Listes)', v:'"Homemade Apple", cursive'},
            {n:'-- CINÉMA / SF / USÉE --', v:'Orbitron'},
            {n:'Orbitron (Star Wars)', v:'Orbitron, sans-serif'},
            {n:'Machine Usée 🖨️', v:'"Special Elite", serif'},
            {n:'Impact (TITRE)', v:'Impact'},
            {n:'-- NORMALES --', v:'Arial'},
            {n:'Arial', v:'Arial'},
            {n:'Verdana', v:'Verdana'}
        ];
        fonts.forEach(f => {
            const o = document.createElement('option'); o.value = f.v; o.innerHTML = f.n;
            if(f.n.startsWith('--')) o.disabled = true; fontSelect.appendChild(o);
        });
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
            const url = prompt("Lien Music :");
            const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="margin:10px 0;"><iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}" frameborder="0" style="border-radius:8px; background:#000;"></iframe></div><p></p>`); }
        }));
        toolbar.appendChild(create('btn-odysee', '🚀 Odysee', () => {
            const url = prompt("Lien MP4 :");
            if(url){
                const poster = prompt("Image poster :", "https://thumbs.odycdn.com/148271f31f8dc54fdca7acb86005784f.webp");
                ed.focus();
                ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:15px 0;"><video width="560" height="315" poster="${poster}" controls muted style="border-radius:12px; background:#000; object-fit: cover;" onmouseover="this.play(); this.muted=false;" onmouseout="this.pause(); this.muted=true;"><source src="${url}" type="video/mp4"></video></div><p></p>`);
            }
        }));
        toolbar.appendChild(create('btn-sc', '☁️ SC', () => {
            const url = prompt("Lien SoundCloud :");
            if(url){ ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}"></iframe><p></p>`); }
        }));

        // --- AJOUT VIMEO ---
        toolbar.appendChild(create('btn-vimeo', '📹 Vimeo', () => {
            const url = prompt("Lien Vimeo :");
            const id = url ? url.match(/(?:vimeo\.com\/|video\/)(\d+)/)?.[1] : null;
            if(id){ ed.focus(); ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:15px 0;"><iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border-radius:12px; background:#000;"></iframe></div><p></p>`); }
        }));

        // --- AJOUT MENU LOGOS TV ---
        const logoList = [
            { name: "📺 Logos TV", url: "" },
            { name: "TF1", url: "https://i.postimg.cc/1fTtZxWH/TF1.png" },
            { name: "France 2", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/France_2_-_logo_2018.svg/1280px-France_2_-_logo_2018.svg.png" },
            { name: "France 3", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/France_3_-_logo_2018.svg/3840px-France_3_-_logo_2018.svg.png" },
            { name: "Canal+", url: "https://i.postimg.cc/WhK3PR9S/Canal.png" },
            { name: "FreeBox Ultra", url: "https://i.postimg.cc/yxLtY09C/image.png" },
            { name: "HBO", url: "https://i.postimg.cc/YCP7xBhZ/image.png" },
            { name: "BeIn Sport", url: "https://i.postimg.cc/SJ5sp0ZD/bein.webp" }
        ];

        const logoSel = document.createElement('select');
        Object.assign(logoSel.style, {
            background: '#180', color: '#eee', border: '1px solid #555', padding: '4px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
        });

        logoList.forEach(l => {
            const o = document.createElement('option'); o.value = l.url; o.textContent = l.name; logoSel.appendChild(o);
        });

        logoSel.onchange = (e) => {
            const logoUrl = e.target.value;
            if (logoUrl) { ed.focus(); ed.execCommand('mceInsertContent', false, `<img src="${logoUrl}" style="height:auto; width:48px; vertical-align:middle; margin:5px;">`); }
            e.target.selectedIndex = 0;
        };
        toolbar.appendChild(logoSel);

        // --- NOUVEAU MENU SURLIGNAGE COULEURS ---
        const highlightList = [
            { n: "🖍️ Surligner", c: "" },
            { n: "Jaune Vif", c: "#ffff00" },
            { n: "Vert Fluo", c: "#00ff00" },
            { n: "Bleu Ciel", c: "#87ceeb" },
            { n: "Rose Bonbon", c: "#ffc0cb" },
            { n: "Orange", c: "#ffa500" },
            { n: "Gris Clair", c: "#d3d3d3" },
            { n: "❌ Effacer", c: "transparent" }
        ];

        const hlSel = document.createElement('select');
        Object.assign(hlSel.style, {
            background: '#fff', color: '#000', border: '1px solid #ccc', padding: '4px', borderRadius: '3px', fontSize: '12px', cursor: 'pointer'
        });

        highlightList.forEach(h => {
            const o = document.createElement('option'); o.value = h.c; o.textContent = h.n; hlSel.appendChild(o);
        });

        hlSel.onchange = (e) => {
            if (e.target.value) { ed.focus(); ed.execCommand('HiliteColor', false, e.target.value); }
            e.target.selectedIndex = 0;
        };
        toolbar.appendChild(hlSel);

        container.insertBefore(toolbar, container.firstChild);
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
