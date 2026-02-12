// ==UserScript==
// @name         Expert Editor Universal - ULTIMATE V5.9.5 Secure + Palette Surlignage
// @namespace    https://github.com/Steven17200
// @version      5.9.5
// @description  Clé Mistral sécurisée + Clé IA en premier + Tableau + Palette surlignage + TOUT intact
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    // Polices Google
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Caveat:wght@400;700&family=Pacifico&family=Dancing+Script:wght@400;700&family=Shadows+Into+Light&family=Michroma&family=Special+Elite&family=Homemade+Apple&family=Yellowtail&family=Satisfy&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Clé Mistral sécurisée
    let MISTRAL_API_KEY = GM_getValue('mistral_api_key', null);

    if (MISTRAL_API_KEY) {
        fetch("https://api.mistral.ai/v1/models", {
            headers: { "Authorization": `Bearer ${MISTRAL_API_KEY}` }
        })
        .then(r => { if (!r.ok) { GM_deleteValue('mistral_api_key'); MISTRAL_API_KEY = null; } })
        .catch(() => {});
    }

    function getOrAskKey() {
        if (!MISTRAL_API_KEY) {
            const key = prompt("Clé Mistral API requise pour IA/US/Analyse\nhttps://console.mistral.ai/api-keys\nColle ici :");
            if (key && key.trim().length > 20) {
                MISTRAL_API_KEY = key.trim();
                GM_setValue('mistral_api_key', MISTRAL_API_KEY);
            } else {
                alert("Pas de clé valide → IA désactivée.");
                return null;
            }
        }
        return MISTRAL_API_KEY;
    }

    async function appelMistral(ed, btn, systemPrompt, fullContent = false) {
        const key = getOrAskKey();
        if (!key) return;

        let text = fullContent ? ed.getContent({ format: 'text' }) : ed.selection.getContent({ format: 'text' });
        if (!text || text.trim().length < 5) { alert("Sélectionne du texte valide !"); return; }

        const originalLabel = btn.innerHTML;
        btn.innerHTML = '⏳';
        btn.disabled = true;

        try {
            const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({
                    model: "open-mistral-7b",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
                    temperature: 0.7
                })
            });

            if (!res.ok) throw new Error(res.status);

            const data = await res.json();
            let result = data.choices[0].message.content.trim();

            ed.focus();
            if (fullContent) {
                let finalHtml = result.replace(/[*_#~]/g, "")
                    .split('\n').filter(line => line.trim() !== "")
                    .map(line => {
                        if (line.includes('<h2') || line.includes('<h3') || line.includes('<span') || line.includes('<div')) return line;
                        return `<p style="margin: 12px 0; line-height: 1.6; font-size: 11pt;">${line}</p>`;
                    }).join('');
                ed.setContent(finalHtml);
            } else {
                ed.execCommand('mceInsertContent', false, result);
            }
            btn.innerHTML = '✅';
        } catch(e) {
            btn.innerHTML = '❌';
        }

        setTimeout(() => { btn.disabled = false; btn.innerHTML = originalLabel; }, 2000);
    }

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
        const toolbar = document.createElement('div');
        toolbar.className = 'expert-editor-toolbar';
        toolbar.style = "background: #f1f1f1; border-bottom: 1px solid #ccc; padding: 5px; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; z-index: 9999;";

        const create = (id, text, onClick) => {
            const btn = document.createElement('button');
            btn.id = id; btn.innerHTML = text; btn.type = 'button';
            btn.style = "padding: 4px 8px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; font-family: sans-serif; color: #000; font-weight: bold;";
            btn.onclick = onClick; return btn;
        };

        // Clé IA en premier
        toolbar.appendChild(create('btn-config-key', '🔑 Clé IA', () => {
            const current = GM_getValue('mistral_api_key', '');
            const key = prompt("Colle ta clé Mistral API :", current);
            if (key === null) return;
            if (key.trim() === '') {
                GM_deleteValue('mistral_api_key');
                MISTRAL_API_KEY = null;
                alert("Clé supprimée.");
            } else if (key.trim().length > 10) {
                GM_setValue('mistral_api_key', key.trim());
                MISTRAL_API_KEY = key.trim();
                alert("Clé enregistrée ✓");
            } else {
                alert("Clé trop courte.");
            }
        }));

        // IA & ANALYSE
        toolbar.appendChild(create('btn-ai-corr', '✨ IA', () => appelMistral(ed, document.getElementById('btn-ai-corr'), "Corrige l'orthographe, la grammaire et améliore légèrement le style si nécessaire.", false)));
        const usBtn = create('btn-ai-us', 'US', () => appelMistral(ed, usBtn, "Translate to Texan English.", false));
        usBtn.style.color = "#ffb300"; toolbar.appendChild(usBtn);
        toolbar.appendChild(create('btn-presentation', '📢 Présentation', () => ed.execCommand('mceInsertContent', false, " (Script expérimental) Bonjour, je suis Mistral ✨, l'IA Française")));
        toolbar.appendChild(create('btn-ai-analyze', '🧐 Analyse', () => {
            const prompt = `Analyse en profondeur les implications de l'article. Structure ta réponse en 3 parties : contexte, arguments pour/contre, conclusion. Donne des chiffres secteur pro/particulier. Fais une proposition pertinente.`;
            appelMistral(ed, document.getElementById('btn-ai-analyze'), prompt, true);
        }));

        // TAILLES
        const sizeSelect = document.createElement('select');
        ['6pt','8pt','10pt','12pt','14pt','18pt','24pt','36pt','48pt','72pt'].forEach(s => {
            const o = document.createElement('option'); o.value = s; o.textContent = s; if(s==='12pt') o.selected=true; sizeSelect.appendChild(o);
        });
        sizeSelect.onchange = e => { ed.focus(); ed.execCommand('FontSize', false, e.target.value); };
        toolbar.appendChild(sizeSelect);

        // POLICES
        const fontSelect = document.createElement('select');
        fontSelect.style = "padding:3px;border:1px solid #ccc;border-radius:3px;font-size:12px;max-width:150px;";
        const fonts = [
            {n:'Choix Police...', v:''},
            {n:'-- ÉCRITURE ATTACHÉE --', v:'Yellowtail'},
            {n:'Yellowtail (Fluide)', v:'Yellowtail, cursive'},
            {n:'Satisfy (Plume)', v:'Satisfy, cursive'},
            {n:'Dancing Script (Cursive)', v:'"Dancing Script", cursive'},
            {n:'-- MANUSCRITE / STYLO --', v:'Caveat'},
            {n:'Caveat (Feutre)', v:'Caveat, cursive'},
            {n:'Shadows Into Light (Note)', v:'"Shadows Into Light", cursive'},
            {n:'Homemade Apple (Listes)', v:'"Homemade Apple", cursive'},
            {n:'-- CINÉMA / SF / USÉE --', v:'Orbitron'},
            {n:'Orbitron (Star Wars)', v:'Orbitron, sans-serif'},
            {n:'Special Elite (Machine usée)', v:'"Special Elite", serif'},
            {n:'Impact (TITRE)', v:'Impact'},
            {n:'-- NORMALES --', v:'Arial'},
            {n:'Arial', v:'Arial'},
            {n:'Verdana', v:'Verdana'}
        ];
        fonts.forEach(f => {
            const o = document.createElement('option'); o.value = f.v; o.textContent = f.n;
            if (f.n.startsWith('--')) o.disabled = true; fontSelect.appendChild(o);
        });
        fontSelect.onchange = e => { ed.focus(); ed.execCommand('FontName', false, e.target.value); };
        toolbar.appendChild(fontSelect);

        // ÉDITION
        toolbar.appendChild(create('btn-bold', 'B', () => ed.execCommand('Bold')));
        toolbar.appendChild(create('btn-italic', 'I', () => ed.execCommand('Italic')));
        toolbar.appendChild(create('btn-underline', 'U', () => ed.execCommand('Underline')));
        toolbar.appendChild(create('btn-strike', 'S', () => ed.execCommand('Strikethrough')));
        toolbar.appendChild(create('btn-list-num', '1.', () => ed.execCommand('InsertOrderedList')));
        toolbar.appendChild(create('btn-list-bullet', '•', () => ed.execCommand('InsertUnorderedList')));
        toolbar.appendChild(create('btn-indent', '>>', () => ed.execCommand('Indent')));
        toolbar.appendChild(create('btn-outdent', '<<', () => ed.execCommand('Outdent')));
        toolbar.appendChild(create('btn-align-left', '←', () => ed.execCommand('JustifyLeft')));
        toolbar.appendChild(create('btn-align-center', '↔', () => ed.execCommand('JustifyCenter')));
        toolbar.appendChild(create('btn-align-right', '→', () => ed.execCommand('JustifyRight')));

        // TABLEAU
        toolbar.appendChild(create('btn-table', 'Tableau', () => {
            ed.focus();
            ed.execCommand('mceInsertTable');
        }));

        toolbar.appendChild(create('btn-link', '🔗', () => {
            const url = prompt("Lien :");
            if (url) ed.execCommand('mceInsertLink', false, url);
        }));

        toolbar.appendChild(create('btn-image', '🖼️', () => {
            const url = prompt("Image URL :");
            if (url) ed.execCommand('mceInsertContent', false, `<img src="${url}" style="max-width:100%;height:auto;">`);
        }));

        toolbar.appendChild(create('btn-emoji', '😀', () => {
            const emoji = prompt("Emoji :");
            if (emoji) ed.execCommand('mceInsertContent', false, emoji);
        }));

        // COULEURS TEXTE
        const colors = [
            { n: "Couleurs Texte", c: "" },
            { n: "Noir", c: "#000000" },
            { n: "Rouge", c: "#ff0000" },
            { n: "Vert", c: "#00ff00" },
            { n: "Bleu", c: "#0000ff" },
            { n: "Jaune", c: "#ffff00" },
            { n: "Blanc", c: "#ffffff" }
        ];

        const colSel = document.createElement('select');
        colors.forEach(col => {
            const o = document.createElement('option'); o.value = col.c; o.textContent = col.n; colSel.appendChild(o);
        });
        colSel.onchange = (e) => {
            if (e.target.value) { ed.focus(); ed.execCommand('ForeColor', false, e.target.value); }
            e.target.selectedIndex = 0;
        };
        toolbar.appendChild(colSel);

        const cpT = document.createElement('input'); cpT.type = 'color'; cpT.title = "Texte"; cpT.style = "width:25px; height:25px; cursor:pointer;";
        cpT.onchange = () => { ed.focus(); ed.execCommand('ForeColor', false, cpT.value); };
        toolbar.appendChild(document.createTextNode(" T:"));
        toolbar.appendChild(cpT);

        const cpS = document.createElement('input'); cpS.type = 'color'; cpS.value = '#ffff00'; cpS.title = "Surlignage"; cpS.style = "width:25px; height:25px; cursor:pointer;";
        cpS.onchange = () => { ed.focus(); ed.execCommand('HiliteColor', false, cpS.value); };
        toolbar.appendChild(document.createTextNode(" S:"));
        toolbar.appendChild(cpS);

        // MÉDIAS
        toolbar.appendChild(create('btn-yt-video', '📺 YouTube', () => {
            const url = prompt("Lien YouTube :");
            const id = url ? url.match(/(?:v=|\/|shorts\/)([\w-]{11})/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:12px;background:#000;"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-yt-shorts', '🎬 SHORTS', () => {
            const url = prompt("Lien Short :");
            const id = url ? url.match(/(?:\/shorts\/|v=)([\w-]{11})/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe width="315" height="560" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:12px;background:#000;"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
            const url = prompt("Lien Music :");
            const id = url ? url.match(/(?:v=|\/)([\w-]+)/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="margin:10px 0;"><iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}" frameborder="0" style="border-radius:8px;background:#000;"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-vimeo', '📹 Vimeo', () => {
            const url = prompt("Lien Vimeo :");
            const id = url ? url.match(/(?:vimeo\.com\/|video\/)(\d+)/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen style="border-radius:12px;background:#000;"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-odysee', '🚀 Odysee', () => {
            const url = prompt("Lien MP4 :");
            if(url){
                const poster = prompt("Image poster :", "https://thumbs.odycdn.com/148271f31f8dc54fdca7acb86005784f.webp");
                ed.focus();
                ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><video width="560" height="315" poster="${poster}" controls muted style="border-radius:12px;background:#000;object-fit:cover;" onmouseover="this.play();this.muted=false;" onmouseout="this.pause();this.muted=true;"><source src="${url}" type="video/mp4"></video></div><p></p>`);
            }
        }));

        toolbar.appendChild(create('btn-sc', '☁️ SC', () => {
            const url = prompt("Lien SoundCloud :");
            if(url) ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}"></iframe><p></p>`);
        }));

        // LOGOS TV
        const logoList = [
            { name: "📺 Logos TV", url: "" },
            { name: "TF1", url: "https://i.postimg.cc/1fTtZxWH/TF1.png" },
            { name: "France 2", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/France_2_-_logo_2018.svg/1280px-France_2_-_logo_2018.svg.png" },
            { name: "France 3", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/France_3_-_logo_2018.svg/3840px-France_3_-_logo_2018.svg.png" },
            { name: "Canal+", url: "https://i.postimg.cc/WhK3PR9S/Canal.png" },
            { name: "FreeBox Ultra", url: "https://i.postimg.cc/yxLtY09C/image.png" },
            { name: "HBO", url: "https://i.postimg.cc/YCP7xBhZ/image.png" },
            { name: "Youtube", url: "https://i.postimg.cc/nrRSNqBZ/Logo-Youtube.png" },
            { name: "Free TV", url: "https://i.postimg.cc/FKwcRpXr/Logo%20Free%20tv.png" },
            { name: "Filmo TV", url: "https://i.postimg.cc/B6g9cYdd/filmo-by-soonor.png" },
            { name: "Molotov TV", url: "https://i.postimg.cc/K8fm5YBM/Molotov.png" },
            { name: "Prime Video", url: "https://i.postimg.cc/BbBzGjqm/Pirme-video.png" },
            { name: "BeIn Sport", url: "https://i.postimg.cc/SJ5sp0ZD/bein.webp" }
        ];

        const logoSel = document.createElement('select');
        Object.assign(logoSel.style, {background:'#180', color:'#eee', border:'1px solid #555', padding:'4px', borderRadius:'4px', fontSize:'12px', cursor:'pointer'});
        logoList.forEach(l => {
            const o = document.createElement('option'); o.value = l.url; o.textContent = l.name; logoSel.appendChild(o);
        });
        logoSel.onchange = (e) => {
            const logoUrl = e.target.value;
            if (logoUrl) { ed.focus(); ed.execCommand('mceInsertContent', false, `<img src="${logoUrl}" style="height:auto; width:48px; vertical-align:middle; margin:5px;">`); }
            e.target.selectedIndex = 0;
        };
        toolbar.appendChild(logoSel);
        container.insertBefore(toolbar, container.firstChild);
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
