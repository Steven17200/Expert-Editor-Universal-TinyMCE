// ==UserScript==
// @name         Expert Editor Universal V2
// @namespace    https://github.com/Steven17200
// @version      6.0.1
// @description  Clé Mistral sécurisée + Clé IA en premier + Tableau + Odysee avec taille + Palettes couleurs texte/surlignage/FOND CASE + Code
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
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Caveat:wght@400;700&family=Pacifico&family=Dancing+Script:wght@400;700&family=Shadows+Into+Light&family=Michroma&family=Special+Elite&family=Homemade+Apple&family=Yellowtail&family=Satisfy&family=Fira+Code&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Clé Mistral sécurisée
    let MISTRAL_API_KEY = GM_getValue('mistral_api_key', null);

    if (MISTRAL_API_KEY) {
        fetch("https://api.mistral.ai/v1/models", {
            headers: {
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            }
        })
        .then(response => {
            if (!response.ok) {
                GM_deleteValue('mistral_api_key');
                MISTRAL_API_KEY = null;
            }
        })
        .catch(() => {
            // Erreur réseau ou autre
        });
    }

    function getOrAskKey() {
        if (!MISTRAL_API_KEY) {
            const key = prompt("Clé Mistral API requise pour IA/US/Analyse\nhttps://console.mistral.ai/api-keys\nColle ici :");
            if (key && key.trim().length > 20) {
                MISTRAL_API_KEY = key.trim();
                GM_setValue('mistral_api_key', MISTRAL_API_KEY);
            } else {
                alert("Pas de clé valide -> IA désactivée.");
                return null;
            }
        }
        return MISTRAL_API_KEY;
    }

    async function appelMistral(ed, btn, systemPrompt, fullContent = false) {
        const key = getOrAskKey();
        if (!key) return;

        let text = "";
        if (fullContent) {
            text = ed.getContent({ format: 'text' });
        } else {
            text = ed.selection.getContent({ format: 'text' });
        }

        if (!text || text.trim().length < 5) {
            alert("Sélectionne du texte valide !");
            return;
        }

        const originalLabel = btn.innerHTML;
        btn.innerHTML = '⏳';
        btn.disabled = true;

        try {
            const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: "open-mistral-7b",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: text }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error("Erreur API : " + response.status);

            const data = await response.json();
            let result = data.choices[0].message.content.trim();

            ed.focus();
            if (fullContent) {
                let finalHtml = result.replace(/[*_#~]/g, "")
                    .split('\n')
                    .filter(line => line.trim() !== "")
                    .map(line => {
                        if (line.includes('<h2') || line.includes('<h3') || line.includes('<span') || line.includes('<div')) return line;
                        return `<p style="margin: 12px 0; line-height: 1.6; font-size: 11pt;">${line}</p>`;
                    })
                    .join('');
                ed.setContent(finalHtml);
            } else {
                ed.execCommand('mceInsertContent', false, result);
            }
            btn.innerHTML = '✅';
        } catch (error) {
            console.error(error);
            btn.innerHTML = '❌';
        }

        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalLabel;
        }, 2000);
    }

    const styleFix = document.createElement('style');
    styleFix.textContent = `
        .mce-window-body, .mce-tableprops { min-width: 720px !important; min-height: 480px !important; overflow: visible !important; }
        .mce-tableprops label { white-space: nowrap !important; width: 240px !important; display: inline-block !important; font-size: 14px !important; margin-right: 10px !important; }
        .mce-tableprops input[type="text"], .mce-tableprops select { width: 220px !important; height: 32px !important; }
        .mce-colorpicker, .mce-colorbox, .mce-flat-colorpicker { display: block !important; visibility: visible !important; opacity: 1 !important; width: 200px !important; height: 200px !important; margin: 15px auto !important; border: 3px solid #444 !important; cursor: pointer !important; background: #fff !important; }
        .mce-tableprops .mce-colorbox { min-height: 36px !important; border: 2px solid #555 !important; }
    `;
    document.head.appendChild(styleFix);

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
        toolbar.style = "background: #f1f1f1; border-bottom: 1px solid #ccc; padding: 5px; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; z-index: 9999; position: relative;";

        const create = (id, text, onClick) => {
            const btn = document.createElement('button');
            btn.id = id;
            btn.innerHTML = text;
            btn.type = 'button';
            btn.style = "padding: 4px 8px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; font-family: sans-serif; color: #000; font-weight: bold;";
            btn.onclick = onClick;
            return btn;
        };

        // --- 1. CONFIG CLÉ IA ---
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

        // --- 2. IA & ANALYSE ---
        toolbar.appendChild(create('btn-ai-corr', '✨ IA', () => {
            appelMistral(ed, document.getElementById('btn-ai-corr'), "Tu es un correcteur expert. Corrige l'orthographe, la grammaire et améliore légèrement le style si nécessaire sans changer le sens.", false);
        }));

        const usBtn = create('btn-ai-us', 'US', () => {
            appelMistral(ed, usBtn, "Tu es un traducteur expert. Traduis le texte sélectionné en anglais américain (US) avec un ton naturel et professionnel.", false);
        });
        usBtn.style.color = "#ffb300";
        toolbar.appendChild(usBtn);

        toolbar.appendChild(create('btn-presentation', '📢 Présentation', () => {
            ed.execCommand('mceInsertContent', false, " (Script expérimental) Bonjour, je suis Mistral ✨, l'IA Française de Steven");
        }));

        toolbar.appendChild(create('btn-ai-analyze', '🧐 Analyse', () => {
            const prompt = `Analyse en profondeur les implications de l'article. Structure ta réponse en 3 parties : contexte, arguments pour/contre, conclusion. Donne des chiffres secteur pro/particulier. Fais une proposition pertinente.`;
            appelMistral(ed, document.getElementById('btn-ai-analyze'), prompt, true);
        }));

        // --- 3. TAILLES ---
        const sizeSelect = document.createElement('select');
        sizeSelect.style = "padding:3px;border:1px solid #ccc;border-radius:3px;font-size:12px;";
        ['6pt','8pt','10pt','12pt','14pt','18pt','24pt','36pt','48pt','72pt'].forEach(s => {
            const o = document.createElement('option');
            o.value = s; o.textContent = s;
            if (s === '12pt') o.selected = true;
            sizeSelect.appendChild(o);
        });
        sizeSelect.onchange = (e) => {
            ed.focus();
            ed.execCommand('FontSize', false, e.target.value);
        };
        toolbar.appendChild(sizeSelect);

        // --- 4. POLICES ---
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
            const o = document.createElement('option');
            o.value = f.v; o.textContent = f.n;
            if (f.n.startsWith('--')) o.disabled = true;
            fontSelect.appendChild(o);
        });
        fontSelect.onchange = (e) => {
            ed.focus();
            ed.execCommand('FontName', false, e.target.value);
        };
        toolbar.appendChild(fontSelect);

        // --- 5. ÉDITION CLASSIQUE ---
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

        // --- 6. TABLEAU ---
        toolbar.appendChild(create('btn-table', 'Tableau', () => {
            ed.focus();
            ed.execCommand('mceInsertTable');
        }));

        // AJOUT BOUTON ZONE DE CODE
        toolbar.appendChild(create('btn-code-zone', '💻 Code', () => {
            ed.focus();
            const codeHtml = `<pre style="background-color: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.5; overflow-x: auto; border: 1px solid #333; margin: 10px 0;"><code>// Votre code ici...</code></pre><p><br></p>`;
            ed.execCommand('mceInsertContent', false, codeHtml);
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

        // --- 7. MÉDIAS ---
        toolbar.appendChild(create('btn-yt-video', '📺 YouTube', () => {
            const url = prompt("Lien YouTube (ou juste l'ID) :");
            if (!url) return;
            const idMatch = url.match(/(?:v=|\/|shorts\/)([\w-]{11})/) || url.match(/^([\w-]{11})$/);
            const id = idMatch ? idMatch[1] : null;
            if (!id) { alert("ID YouTube non détecté."); return; }
            const largeurStr = prompt("Largeur (pixels) ?", "560");
            let width = parseInt(largeurStr, 10) || 560;
            const height = Math.round(width * 9 / 16);
            let posterUrl = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
            const customPoster = prompt("Image poster perso (optionnel) :");
            if (customPoster && customPoster.trim()) posterUrl = customPoster.trim();
            ed.focus();
            ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:12px;background:#000;" allow="autoplay; encrypted-media" poster="${posterUrl}"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-yt-shorts', '🎬 SHORTS', () => {
            const url = prompt("Lien Short :");
            const id = url ? url.match(/(?:\/shorts\/|v=)([\w-]{11})/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe width="315" height="560" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:12px;background:#000;"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
            const url = prompt("Lien Music :");
            if (!url) return;
            const match = url.match(/(?:v=|youtu\.be\/|\/embed\/|music\.youtube\.com\/watch\?v=|\/watch\?v=)([\w-]{11})/i);
            const id = match ? match[1] : null;
            if (id) {
                ed.focus();
                ed.execCommand('mceInsertContent', false, `<div style="margin:10px 0;"><iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="border-radius:8px;background:#000;"></iframe></div><p></p>`);
            } else { alert("Lien invalide !"); }
        }));

        toolbar.appendChild(create('btn-vimeo', '📹 Vimeo', () => {
            const url = prompt("Lien Vimeo :");
            const id = url ? url.match(/(?:vimeo\.com\/|video\/)(\d+)/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen style="border-radius:12px;background:#000;"></iframe></div><p></p>`);
        }));

        toolbar.appendChild(create('btn-odysee', '🚀 Odysee', () => {
            const url = prompt("Lien MP4 Odysee :");
            if (!url) return;
            const taille = prompt("Taille ? (1:320, 2:560, 3:800, 4:100%)", "2") || "2";
            let w = "560", h = "315", styleW = "";
            if (taille === "1") { w = "320"; h = "180"; }
            else if (taille === "2") { w = "560"; h = "315"; }
            else if (taille === "3") { w = "800"; h = "450"; }
            else if (taille === "4") { w = "100%"; h = "450"; styleW = "width:100%; max-width:100%;"; }

            const poster = prompt("Poster URL :", "https://i.postimg.cc/fyQ4vRb5/C.gif");
            const videoId = 'odysee-video-' + Date.now();
            const videoHtml = `
                <div style="display:flex;justify-content:center;margin:15px 0;position:relative;">
                    <video id="${videoId}" ${styleW ? 'style="' + styleW + '"' : ''} width="${w}" height="${h}" poster="${poster}" controls muted autoplay>
                        <source src="${url}" type="video/mp4">
                    </video>
                    <div id="${videoId}-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.1); display:flex; justify-content:center; align-items:center; color:white; font-size:24px; cursor:pointer;">
                        🔊 Cliquez pour activer le son
                    </div>
                </div><p></p>`;
            ed.focus();
            ed.execCommand('mceInsertContent', false, videoHtml);
            setTimeout(() => {
                const video = document.getElementById(videoId);
                const overlay = document.getElementById(`${videoId}-overlay`);
                if (video && overlay) {
                    overlay.addEventListener('click', function() {
                        video.muted = false;
                        overlay.style.display = 'none';
                    });
                }
            }, 100);
        }));

        // --- 8. LOGOS TV (TOUS CONSERVÉS) ---
        const logoList = [
            { name: "📺 Logos TV", url: "" },
            { name: "TF1", url: "https://i.postimg.cc/1fTtZxWH/TF1.png" },
            { name: "TF1+", url: "https://i.postimg.cc/qhH48SH9/ob-907eeb-tf1.webp" },
            { name: "France 2", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/France_2_-_logo_2018.svg/1280px-France_2_-_logo_2018.svg.png" },
            { name: "France 3", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/France_3_-_logo_2018.svg/3840px-France_3_-_logo_2018.svg.png" },
            { name: "Canal+", url: "https://i.postimg.cc/WhK3PR9S/Canal.png" },
            { name: "M6", url: "https://i.postimg.cc/QMMxprrp/M6-logo-svg.png" },
            { name: "M6+", url: "https://i.postimg.cc/jwYtzmYp/M6-logo-q-noir-jaune.png" },
            { name: "FreeBox Ultra", url: "https://i.postimg.cc/yxLtY09C/image.png" },
            { name: "HBO", url: "https://i.postimg.cc/YCP7xBhZ/image.png" },
            { name: "Youtube", url: "https://i.postimg.cc/nrRSNqBZ/Logo-Youtube.png" },
            { name: "Free TV", url: "https://i.postimg.cc/FKwcRpXr/Logo%20Free%20tv.png" },
            { name: "Filmo TV", url: "https://i.postimg.cc/B6g9cYdd/filmo-by-soonor.png" },
            { name: "Apple TV 4K", url: "https://i.postimg.cc/tsz30gJ9/Apple-TV4K.png" },
            { name: "Google TV", url: "https://i.postimg.cc/CR4GyK5g/Google-TV-logo-svg.png" },
            { name: "Molotov TV", url: "https://i.postimg.cc/K8fm5YBM/Molotov.png" },
            { name: "Prime Video", url: "https://i.postimg.cc/BbBzGjqm/Pirme-video.png" },
            { name: "VIDAA", url: "https://i.postimg.cc/9r93Y6MT/vidaa.png" },
            { name: "TIZEN OS", url: "https://i.postimg.cc/vcnRtJBV/Tizen.png" },
            { name: "BeIn Sport", url: "https://i.postimg.cc/SJ5sp0ZD/bein.webp" },
            { name: "Netflix", url: "https://i.postimg.cc/nXzpzN3F/Netflix-Logomark.png" },
            { name: "Paramount+", url: "https://i.postimg.cc/ZWR4RXw5/Paramount-logo-svg.png" },
            { name: "Pluto TV", url: "https://i.postimg.cc/18tstbvR/Pluto-TV-2020-logo.png" },
            { name: "Cafeyn", url: "https://i.postimg.cc/Dm5yR0gN/20250520062620-Cafeyn-logo-svg.png" },
            { name: "ByCanal", url: "https://i.postimg.cc/w3FTnMVZ/By-Canal.png" },
            { name: "Disney+", url: "https://i.postimg.cc/SjVNHRr5/Dinsey.png" },
            { name: "Universal+", url: "https://i.postimg.cc/K4QvCjNd/Universal.png" },
            { name: "Orange Telecom", url: "https://i.postimg.cc/qvngQm8F/Orange.webp" },
            { name: "SFR", url: "https://i.postimg.cc/k2VBXN5X/SFR.png" },
            { name: "Free", url: "https://i.postimg.cc/mh8DYpcv/Free-logo-svg.png" },
            { name: "Free Mobile", url: "https://i.postimg.cc/t72T3vZ0/Logo-free-mobile2022.png" },
            { name: "Reef", url: "https://i.postimg.cc/Y99Jh0KC/reef.png" },
            { name: "Bouygue Telecom", url: "https://i.postimg.cc/ZW9CKPqC/Logo-By-Tel-Ent.png" },
            { name: "Free-Box-Delta", url: "https://i.postimg.cc/0bgcR5yc/Free-Box-Ultra.png" },
            { name: "PLEX", url: "https://i.postimg.cc/TY6hPCyP/PLEX.png" },
            { name: "INFUSE", url: "https://i.postimg.cc/fbX6kjSw/Infuse-8.png" },
            { name: "Spliiit+", url: "https://i.postimg.cc/65fNr43x/Spliiit.png" },
            { name: "Mistral IA", url: "https://www.3ds.com/assets/invest/2024-06/logo-mistral.png" },
            { name: "Service", url: "https://i.postimg.cc/9r3J5XQ8/Service.png" },
            { name: "Prix", url: "https://i.postimg.cc/56cnd92P/Prix.png" },
            { name: "Fleche verte (OK)", url: "https://i.postimg.cc/Hrp1NRqw/Fleche-verte-(OK).png" },
            { name: "Croix Rouge (non)", url: "https://i.postimg.cc/871gY92B/Croix-Rouge-(non).png" }
        ];

        const logoSel = document.createElement('select');
        logoSel.style = "background:#180; color:#eee; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px; cursor:pointer;";
        logoList.forEach(l => {
            const o = document.createElement('option');
            o.value = l.url; o.textContent = l.name;
            logoSel.appendChild(o);
        });
        logoSel.onchange = (e) => {
            const logoUrl = e.target.value;
            if (logoUrl) {
                ed.focus();
                ed.execCommand('mceInsertContent', false, `<img src="${logoUrl}" style="height:auto; width:48px; vertical-align:middle; margin:5px;">`);
            }
            e.target.selectedIndex = 0;
        };
        toolbar.appendChild(logoSel);

        // --- 9. PALETTES COULEURS ---

        // TEXTE
        const textColorLabel = document.createElement('span');
        textColorLabel.textContent = 'Texte : ';
        textColorLabel.style = 'font-size:12px; color:#333; margin-left:8px; margin-right:4px; font-weight:bold;';
        toolbar.appendChild(textColorLabel);

        const textColorPicker = document.createElement('input');
        textColorPicker.type = 'color';
        textColorPicker.value = '#000000';
        textColorPicker.style = 'width:32px; height:24px; padding:0; border:1px solid #999; border-radius:4px; vertical-align:middle; cursor:pointer;';
        textColorPicker.onchange = (e) => {
            if (e.target.value) {
                ed.focus();
                ed.execCommand('ForeColor', false, e.target.value);
            }
        };
        toolbar.appendChild(textColorPicker);

        // SUR LIGNAGE (Highlight)
        const highlightLabel = document.createElement('span');
        highlightLabel.textContent = 'Surlign. : ';
        highlightLabel.style = 'font-size:12px; color:#333; margin-left:12px; margin-right:4px; font-weight:bold;';
        toolbar.appendChild(highlightLabel);

        const highlightPicker = document.createElement('input');
        highlightPicker.type = 'color';
        highlightPicker.value = '#ffff00';
        highlightPicker.style = 'width:32px; height:24px; padding:0; border:1px solid #999; border-radius:4px; vertical-align:middle; cursor:pointer;';
        highlightPicker.onchange = (e) => {
            if (e.target.value) {
                ed.focus();
                ed.execCommand('HiliteColor', false, e.target.value);
            }
        };
        toolbar.appendChild(highlightPicker);

        // --- NOUVEAUTÉ : FOND CASE TABLEAU (100% Fonctionnel) ---
        const bgCaseLabel = document.createElement('span');
        bgCaseLabel.textContent = 'Fond Case : ';
        bgCaseLabel.style = 'font-size:12px; color:#333; margin-left:12px; margin-right:4px; font-weight:bold;';
        toolbar.appendChild(bgCaseLabel);

        const bgCasePicker = document.createElement('input');
        bgCasePicker.type = 'color';
        bgCasePicker.value = '#ffffff';
        bgCasePicker.style = 'width:32px; height:24px; padding:0; border:1px solid #999; border-radius:4px; vertical-align:middle; cursor:pointer;';
        bgCasePicker.onchange = (e) => {
            ed.focus();
            const color = e.target.value;
            // On cherche la cellule parente (td ou th)
            const cell = ed.dom.getParent(ed.selection.getStart(), 'td,th');
            if (cell) {
                ed.dom.setStyle(cell, 'background-color', color);
                ed.nodeChanged();
            } else {
                // Si pas dans un tableau, on applique un fond de bloc classique
                ed.execCommand('mceApplyTextcolor', 'backcolor', color);
            }
        };
        toolbar.appendChild(bgCasePicker);

        // BOUTON GOMME
        const clearHighlightBtn = create('btn-clear-highlight', '❌', () => {
            ed.focus();
            // Supprime surlignage texte
            ed.execCommand('HiliteColor', false, 'transparent');
            // Supprime fond de case si présent
            const cell = ed.dom.getParent(ed.selection.getStart(), 'td,th');
            if (cell) ed.dom.setStyle(cell, 'background-color', '');
            ed.nodeChanged();
        });
        clearHighlightBtn.style = 'margin-left:8px; padding:4px 8px; font-size:14px;';
        toolbar.appendChild(clearHighlightBtn);

        // Injection Toolbar
        container.insertBefore(toolbar, container.firstChild);
    }

    // Lancement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
