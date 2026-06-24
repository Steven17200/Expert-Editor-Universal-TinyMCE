// ==UserScript==
// @name         Expert Editor Universal V4
// @namespace    https://github.com/Steven17200
// @version      6.0.5
// @description  Clé Mistral sécurisée + Clé IA en premier + Tableau + Odysee avec taille + Palettes couleurs texte/surlignage/FOND CASE + Code + Tableau Gris Publication HTML + Dimensions, cadre et lien cliquable pour les images + Flow Music
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://www.universfreebox.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @updateURL    https://raw.githubusercontent.com/Steven17200/Expert-Editor-Universal-TinyMCE/main/Expert_Editor_Universal%20.user.js
// @downloadURL  https://raw.githubusercontent.com/Steven17200/Expert-Editor-Universal-TinyMCE/main/Expert_Editor_Universal%20.user.js
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

    function autoAcceptCookies() {
        // Liste des sélecteurs courants pour les boutons d'acceptation des cookies
        const cookieSelectors = [
            // Sélecteurs génériques
            'button[aria-label*="accept" i]',
            'button[aria-label*="cookie" i]',
            'button[id*="cookie" i]',
            'button[id*="accept" i]',
            'button[class*="cookie" i]',
            'button[class*="accept" i]',
            'button[class*="consent" i]',
            'button[class*="agree" i]',
            // Sélecteurs spécifiques à certains sites
            '#cookie-accept',
            '#cookie-consent-accept',
            '#accept-cookies',
            '#acceptAllCookies',
            '#cookie-ok',
            '#cookie-button',
            '.cookie-consent button',
            '.cookie-banner button',
            '.cookie-modal button',
            '.cookie-popup button',
            '.cookie-accept',
            '.cookie-accept-all',
            '.cookie-agree',
            '.cookie-ok',
            '.cookie-yes',
            '.cookie-allow',
            // Sélecteurs pour les modales (ex: Shadow DOM)
            'div[role="dialog"] button',
            'div[role="alertdialog"] button',
            // Sélecteurs pour les iframes (ex: Google Consent)
            'iframe[src*="consent"]',
            'iframe[src*="cookie"]'
        ];

        // Fonction pour cliquer sur un bouton si trouvé
        const clickCookieButton = () => {
            for (const selector of cookieSelectors) {
                const buttons = document.querySelectorAll(selector);
                for (const btn of buttons) {
                    if (btn.offsetParent !== null) { // Vérifie que le bouton est visible
                        const btnText = (btn.textContent || btn.innerText || '').toLowerCase();
                        const isAcceptButton = 
                            btnText.includes('accept') ||
                            btnText.includes('ok') ||
                            btnText.includes('agree') ||
                            btnText.includes('allow') ||
                            btnText.includes('consent') ||
                            btnText.includes('tout accepter') ||
                            btnText.includes('tout autoriser') ||
                            btnText.includes('je suis d\'accord') ||
                            btnText.includes('d\'accord');

                        if (isAcceptButton) {
                            btn.click();
                            console.log('✅ Bouton de cookies cliqué :', selector);
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        // Essayer de cliquer sur un bouton de cookies
        if (clickCookieButton()) {
            // Attendre 1 seconde puis réessayer l'initialisation
            setTimeout(() => {
                if (typeof tinyMCE !== 'undefined' && tinyMCE.editors && tinyMCE.editors.length > 0) {
                    tinyMCE.editors.forEach(setupEditor);
                } else {
                    setTimeout(init, 1000);
                }
            }, 1000);
            return true;
        }
        return false;
    }

    function init() {
        // D'abord, essayer d'accepter les cookies automatiquement
        if (autoAcceptCookies()) {
            return; // On attend le callback dans autoAcceptCookies
        }

        // Sinon, vérifier si TinyMCE est déjà chargé
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
        ['4pt','6pt','8pt','10pt','12pt','14pt','18pt','20pt','24pt','28pt','36pt','48pt','72pt'].forEach(s => {
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
            {n:'-- MARQUES / THÈMES --', v:'Bebas Neue'},
            {n:'NETFLIX (Impacté)', v:'"Bebas Neue", Arial Black, sans-serif'},
            {n:'FREE (Opérateur)', v:'"Inter", "Segoe UI", sans-serif'},
            {n:'ALLOCINÉ (Rond & Gras)', v:'"Arial Black", "Century Gothic", sans-serif'},
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
        // --- 5. CARACTÈRES SPÉCIAUX & SYMBOLES ---
        const charSelect = document.createElement('select');
        charSelect.style = "padding:3px;border:1px solid #ccc;border-radius:3px;font-size:12px;max-width:120px;margin-left:5px;";

        const chars = [
            {n:'Insertion...', v:''},
            {n:'-- MAJUSCULES ACCENTUÉES --', v:''},
            {n:'É (E accent aigu)', v:'É'},
            {n:'È (E accent grave)', v:'È'},
            {n:'À (A accent grave)', v:'À'},
            {n:'Ç (C cédille)', v:'Ç'},
            {n:'-- ICÔNES CONTACT --', v:''},
            {n:'📞 (Téléphone classique)', v:'📞'},
            {n:'📱 (Téléphone portable)', v:'📱'},
            {n:'✉️ (Enveloppe / Email)', v:'✉️'},
            {n:'📧 (Email carré)', v:'📧'},
            {n:'-- CINÉMA & COUTUME --', v:''},
            {n:'🎬 (Clap de cinéma)', v:'🎬'},
            {n:'🍿 (Pop-corn)', v:'🍿'},
            {n:'⭐ (Étoile)', v:'⭐'}
        ];

        chars.forEach(c => {
            const o = document.createElement('option');
            o.value = c.v; o.textContent = c.n;
            if (c.n.startsWith('--')) o.disabled = true;
            charSelect.appendChild(o);
        });

        charSelect.onchange = (e) => {
            if (e.target.value !== '') {
                ed.focus();
                // Insère le caractère directement à la position du curseur
                ed.execCommand('insertHTML', false, e.target.value);
                // Réinitialise le menu sur "Insertion..." pour pouvoir ré-utiliser le même caractère
                charSelect.selectedIndex = 0;
            }
        };

        toolbar.appendChild(charSelect);
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
        
        // --- TABLEAU GRIS POUR PUBLICATION (avec surlignage coloré) ---
        toolbar.appendChild(create('btn-table-gris', 'Tableau Gris', () => {
            ed.focus();
            // Insérer un tableau 3x3 avec fond gris et bordures
            const tableHtml = `
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0; background-color: #e0e0e0; color: #000000; border: 1px solid #888;">
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 1</td>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 2</td>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 3</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 4</td>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #ffff00; color: #000;">Surlignée</td>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 6</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 7</td>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 8</td>
                            <td style="border: 1px solid #888; padding: 8px; background-color: #e0e0e0; color: #000;">Cellule 9</td>
                        </tr>
                    </tbody>
                </table>
                <p><br></p>
            `;
            ed.execCommand('mceInsertContent', false, tableHtml);
            alert("✅ Tableau gris inséré ! Utilisez le sélecteur 'Fond Case' pour changer la couleur de surlignage.");
        }));
        // --- CARACTÈRES SPÉCIAUX ---
        toolbar.appendChild(create('btn-arrow-right', '→', () => {
             ed.execCommand('mceInsertContent', false, '→');
        }));
        toolbar.appendChild(create('btn-arrow-left', '←', () => {
             ed.execCommand('mceInsertContent', false, '←');
        }));
        toolbar.appendChild(create('btn-double-angle-right', '»', () => {
             ed.execCommand('mceInsertContent', false, '»');
        }));
        toolbar.appendChild(create('btn-double-angle-left', '«', () => {
             ed.execCommand('mceInsertContent', false, '«');
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
            const url = prompt("URL de l'image :");
            if (!url) return;

            // Demander les dimensions (largeur/hauteur)
            const width = prompt("Largeur (ex: 300px ou 50%) :", "100%");
            const height = prompt("Hauteur (ex: 200px ou auto) :", "auto");

            // Demander le cadre (border)
            const borderWidth = prompt("Épaisseur du cadre (en pixels, ex: 2) :", "0");
            const borderColor = prompt("Couleur du cadre (ex: #000000 ou red) :", "#000000");

            // Demander si l'image doit être cliquable
            const addLink = confirm("Voulez-vous que l'image soit cliquable ?");
            let linkUrl = null;
            if (addLink) {
                linkUrl = prompt("URL du lien (ex: https://example.com) :");
                if (!linkUrl) return;
            }

            // Construire le style CSS
            let style = `max-width:100%;`;
            if (width) style += `width:${width};`;
            if (height) style += `height:${height};`;
            if (borderWidth && borderWidth !== "0") {
                style += `border:${borderWidth}px solid ${borderColor};`;
            }

            // Construire le HTML final
            let imgHtml = `<img src="${url}" style="${style}">`;
            if (linkUrl) {
                const openInNewTab = confirm("Ouvrir le lien dans un nouvel onglet ?");
                const target = openInNewTab ? ' target="_blank"' : '';
                imgHtml = `<a href="${linkUrl}"${target}>${imgHtml}</a>`;
            }

            // Insérer l'image (ou le lien + image)
            ed.execCommand('mceInsertContent', false, imgHtml);
        }));
        toolbar.appendChild(create('btn-emoji', '😀', () => {
            const emoji = prompt("Emoji :");
            if (emoji) ed.execCommand('mceInsertContent', false, emoji);
        }));

// --- 7. MÉDIAS ---
// --- Speedtest (image PNG) ---
toolbar.appendChild(create('btn-speedtest', '📊 Speedtest', () => {
    const url = prompt("Colle le lien Speedtest (ex: https://www.speedtest.net/result/a/11591345182) :");
    if (!url) return;

    // Extraction de l'ID (supporte les formats : /result/a/ID ou /result/ID)
    const idMatch = url.match(/(?:result\/a\/|result\/)([a-zA-Z0-9]+)/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) {
        alert("❌ ID non détecté. Vérifie le lien.");
        return;
    }

    // URL de l'image générée par Speedtest
    const imageUrl = `https://www.speedtest.net/result/a/${id}.png`;

    ed.focus();
    ed.execCommand('mceInsertContent', false,
        `<div style="display:flex;justify-content:center;margin:15px 0;">
            <img src="${imageUrl}"
                 style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:8px; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
        </div><p></p>`
    );
    alert("✅ Speedtest inséré (image PNG).");
}));
        // --- Intégrer une page web (iframe) ---
toolbar.appendChild(create('btn-embed-webpage', '🌐 Page Web', () => {
    const url = prompt("URL de la page à intégrer (ex: https://boutique.canalplus.com/) :");
    if (!url) return;

    // Vérification basique de l'URL (doit commencer par http:// ou https://)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert("❌ L'URL doit commencer par http:// ou https://");
        return;
    }

    const width = prompt("Largeur (pixels ou %) :", "100%");
    if (!width) return;

    const height = prompt("Hauteur (pixels, ex: 500px) :", "500px");
    if (!height) return;

    ed.focus();
    ed.execCommand('mceInsertContent', false,
        `<div style="display:flex;justify-content:center;margin:15px 0;">
            <iframe
                src="${url}"
                width="${width}"
                height="${height}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                style="border-radius:8px; background:#fff; border:1px solid #ddd; max-width:100%;">
            </iframe>
        </div><p></p>`
    );
    alert(`✅ Page intégrée (${width} × ${height}).`);
}));
// YouTube avec hauteur libre + choix autoplay
toolbar.appendChild(create('btn-yt-video', '📺 YouTube', () => {
    const url = prompt("Lien YouTube (ou juste l'ID) :");
    if (!url) return;

    const idMatch = url.match(/(?:v=|\/|shorts\/)([\w-]{11})/) || url.match(/^([\w-]{11})$/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) { alert("ID YouTube non détecté."); return; }

    const largeurStr = prompt("Largeur (pixels) ?", "560");
    let width = parseInt(largeurStr, 10) || 560;

    const hauteurStr = prompt("Hauteur (pixels) ?", "315");
    let height = parseInt(hauteurStr, 10) || 315;

    const autoPlayChoix = prompt("Autoplay ? (1 = oui / 0 = non)", "1");
    const autoplay = (autoPlayChoix === "1") ? "1" : "0";

    const iframeSrc = `https://www.youtube.com/embed/${id}?autoplay=${autoplay}&mute=0&loop=1&playlist=${id}&enablejsapi=1`;

    ed.focus();
    ed.execCommand('mceInsertContent', false,
        `<div style="display:flex;justify-content:center;margin:15px 0;">
            <iframe
                width="${width}"
                height="${height}"
                src="${iframeSrc}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                style="border-radius:12px;background:#000;"
                allowfullscreen>
            </iframe>
        </div><p></p>`
    );

    const status = (autoplay === "1") ? "avec autoplay" : "sans autoplay";
    alert(`YouTube inséré (${width}×${height}) ${status}. Le son peut demander un clic selon le navigateur.`);
}));
// --- X (Twitter) VIDÉO - sans barre de défilement vertical (version renforcée) ---
toolbar.appendChild(create('btn-x-video', '𝕏 Vidéo', () => {
    const url = prompt("Lien X complet ou ID du post :");
    if (!url) return;

    let postId = null;
    const idMatch = url.match(/\/status\/(\d+)/);
    if (idMatch) postId = idMatch[1];
    else if (/^\d{15,20}$/.test(url.trim())) postId = url.trim();

    if (!postId) {
        alert("ID non détecté. Exemple : https://x.com/user/status/1234567890123456789");
        return;
    }

    const choix = prompt("Choisis :\n1 = iframe direct (hauteur auto)\n2 = hauteur manuelle\n3 = iframe + essayer autoplay", "1");

    let xHtml = '';

    if (choix === "1") {
        xHtml = `
            <div style="display:flex;justify-content:center;margin:15px 0;">
                <iframe
                    src="https://platform.twitter.com/embed/Tweet.html?id=${postId}&hideCard=false&hideThread=false&theme=light&lang=fr"
                    width="560"
                    height="auto"
                    frameborder="0"
                    scrolling="no"
                    style="border-radius:12px; background:#fff; max-width:100%; border:1px solid #ddd; min-height:500px; overflow:hidden !important; scrollbar-width:none !important; -ms-overflow-style:none !important;">
                </iframe>
            </div><p></p>`;
    }
    else if (choix === "2") {
        const largeurStr = prompt("Largeur pixels ?", "560");
        let width = parseInt(largeurStr, 10) || 560;
        const hauteurStr = prompt("Hauteur pixels ? (600-900 pour vidéo)", "700");
        let height = parseInt(hauteurStr, 10) || 700;

        xHtml = `
            <div style="display:flex;justify-content:center;margin:15px 0;">
                <iframe
                    src="https://platform.twitter.com/embed/Tweet.html?id=${postId}&hideCard=false&hideThread=false&theme=light&lang=fr"
                    width="${width}"
                    height="${height}"
                    frameborder="0"
                    scrolling="no"
                    style="border-radius:12px; background:#fff; max-width:100%; border:1px solid #ddd; overflow:hidden !important; scrollbar-width:none !important; -ms-overflow-style:none !important;">
                </iframe>
            </div><p></p>`;
    }
    else {
        const largeurStr = prompt("Largeur pixels ?", "560");
        let width = parseInt(largeurStr, 10) || 560;
        const hauteurStr = prompt("Hauteur pixels ?", "700");
        let height = parseInt(hauteurStr, 10) || 700;

        xHtml = `
            <div style="display:flex;justify-content:center;margin:15px 0;">
                <iframe
                    src="https://platform.twitter.com/embed/Tweet.html?id=${postId}&hideCard=false&hideThread=false&theme=light&lang=fr"
                    width="${width}"
                    height="${height}"
                    frameborder="0"
                    scrolling="no"
                    allow="autoplay; encrypted-media"
                    style="border-radius:12px; background:#fff; max-width:100%; border:1px solid #ddd; overflow:hidden !important; scrollbar-width:none !important; -ms-overflow-style:none !important;">
                </iframe>
            </div><p></p>`;
    }

    ed.focus();
    ed.execCommand('mceInsertContent', false, xHtml);
    alert("Post X inséré sans barre de défilement (version renforcée).");
}));
// --- YouTube Music (player qui démarre) ---
toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
    const url = prompt("Lien YouTube Music :");
    if (!url) return;

    const match = url.match(/(?:v=|youtu\.be\/|\/embed\/|music\.youtube\.com\/watch\?v=|\/watch\?v=)([\w-]{11})/i);
    const id = match ? match[1] : null;
    if (!id) { alert("Lien invalide !"); return; }

    ed.focus();
    ed.execCommand('mceInsertContent', false,
        `<div style="margin:10px 0;">
            <iframe width="100%" height="80"
                src="https://www.youtube.com/embed/${id}?autoplay=1&controls=1&rel=0"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                style="border-radius:8px;background:#000;">
            </iframe>
        </div><p></p>`
    );

    alert("YouTube Music inséré avec autoplay. Le son démarre souvent après un clic (règles navigateur).");
}));

// --- Flow Music (lecteur audio) ---
toolbar.appendChild(create('btn-flow-music', '🎶 Flow Music', () => {
    const url = prompt("Lien Flow Music (ex: https://www.flowmusic.app/song/f25d46e2-e58e-4e5f-a0a4-ab209126dadc) :");
    if (!url) return;

    // Extraire l'ID de la chanson depuis l'URL
    const idMatch = url.match(/(?:song\/|\/song\/)([a-f0-9-]{36})/i);
    const songId = idMatch ? idMatch[1] : null;
    
    if (!songId) {
        alert("❌ ID de chanson non détecté. Vérifie le lien.");
        return;
    }

    // Demander la taille du lecteur
    const width = prompt("Largeur (pixels ou %) :", "100%");
    const height = prompt("Hauteur (pixels, ex: 120px) :", "120px");

    // Générer l'iframe vers Flow Music
    ed.focus();
    ed.execCommand('mceInsertContent', false,
        `<div style="display:flex;justify-content:center;margin:15px 0;">
            <iframe
                src="https://www.flowmusic.app/song/${songId}"
                width="${width}"
                height="${height}"
                frameborder="0"
                allow="autoplay; encrypted-media"
                style="border-radius:8px; background:#fff; border:1px solid #ddd; max-width:100%;">
            </iframe>
        </div><p></p>`
    );

    alert(`✅ Flow Music inséré (${width} × ${height}). L'utilisateur devra cliquer sur le bouton Play.`);
}));
        toolbar.appendChild(create('btn-vimeo', '📹 Vimeo', () => {
            const url = prompt("Lien Vimeo :");
            const id = url ? url.match(/(?:vimeo\.com\/|video\/)(\d+)/)?.[1] : null;
            if(id) ed.execCommand('mceInsertContent', false, `<div style="display:flex;justify-content:center;margin:15px 0;"><iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen style="border-radius:12px;background:#000;"></iframe></div><p></p>`);
        }));
toolbar.appendChild(create('btn-odysee', '🚀 Odysee', () => {
    const url = prompt("Lien Odysee (ex: https://odysee.com/@Plex:02/Champs-Élysées:e) :");
    if (!url) return;

    // Transformer le lien utilisateur en URL d'embedding
    let embedUrl = url.replace("odysee.com/", "odysee.com/$/embed/");

    // Demander l'orientation
    const orientation = prompt("Orientation ? (1: Horizontal, 2: Vertical)", "1") || "1";
    let w, h, styleW = "";

    if (orientation === "1") {
        // Horizontal (16:9)
        const taille = prompt("Taille horizontale ? (1: 320, 2: 560, 3: 800, 4: 100%)", "2") || "2";
        if (taille === "1") { w = "320"; h = "180"; }
        else if (taille === "2") { w = "560"; h = "315"; }
        else if (taille === "3") { w = "800"; h = "450"; }
        else if (taille === "4") { w = "100%"; h = "450"; styleW = "width:100%; max-width:100%;"; }
    } else {
        // Vertical (9:16)
        const taille = prompt("Taille verticale ? (1: 180, 2: 315, 3: 450, 4: 100%)", "2") || "2";
        if (taille === "1") { w = "180"; h = "320"; }
        else if (taille === "2") { w = "315"; h = "560"; }
        else if (taille === "3") { w = "450"; h = "800"; }
        else if (taille === "4") { w = "100%"; h = "80vh"; styleW = "width:100%; max-width:560px;"; }
    }

    // Générer le code HTML pour l'iframe
    const videoHtml = `
        <div style="display:flex;justify-content:center;margin:15px 0;">
            <iframe
                ${styleW ? 'style="' + styleW + '"' : ''}
                width="${w}"
                height="${h}"
                src="${embedUrl}"
                frameborder="0"
                allowfullscreen>
            </iframe>
        </div><p></p>`;

    ed.focus();
    ed.execCommand('mceInsertContent', false, videoHtml);
}));
        // --- 8. PUBLICATION HTML (Nouveau bouton pour insérer un cadre HTML avec fond gris et surlignage coloré) ---
        toolbar.appendChild(create('btn-html-frame', '📰 Publication HTML', () => {
            const htmlContent = prompt("Collez votre code HTML pour la publication :", "<p>Votre contenu ici...</p>");
            if (!htmlContent) return;

            // Nettoyer le HTML pour éviter les problèmes de sécurité (basique)
            const cleanHtml = htmlContent
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les balises script
                .replace(/javascript:/gi, '') // Supprimer les appels javascript
                .replace(/on\w+="[^"]*"/g, ''); // Supprimer les attributs on* (onclick, onerror, etc.)

            // Créer un cadre stylisé pour la publication HTML avec fond gris et texte noir
            const frameHtml = `
                <div style="
                    border: 2px solid #888;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    background-color: #e0e0e0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    max-width: 100%;
                    overflow: hidden;
                    color: #000000;
                ">
                    ${cleanHtml}
                </div>
                <p><br></p>
            `;

            ed.focus();
            ed.execCommand('mceInsertContent', false, frameHtml);
            alert("✅ Publication HTML insérée avec fond gris et texte noir ! Utilisez le surligneur pour égayer.");
        }));

        // --- 10. LOGOS TV (TOUS CONSERVÉS) ---
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
            { name: "Apple TV+", url: "https://i.postimg.cc/vBKN2YYH/Apple-TV-logo.png" },
            { name: "Apple Music", url: "https://i.postimg.cc/h46B6Trc/Apple-Music-Logo.png" },
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
            { name: "FamilleByCanal", url: "https://i.postimg.cc/mrRYD6Nj/Famille-By-Canal.png" },
            { name: "Disney+", url: "https://i.postimg.cc/SjVNHRr5/Dinsey.png" },
            { name: "Universal+", url: "https://i.postimg.cc/K4QvCjNd/Universal.png" },
            { name: "Orange Telecom", url: "https://i.postimg.cc/qvngQm8F/Orange.webp" },
            { name: "Ligue1+", url: "https://i.postimg.cc/HnxMXRqt/Ligue1.webp" },
            { name: "SFR", url: "https://i.postimg.cc/k2VBXN5X/SFR.png" },
            { name: "Free", url: "https://i.postimg.cc/mh8DYpcv/Free-logo-svg.png" },
            { name: "Free PRO", url: "https://i.postimg.cc/sgS2KrXz/Free-PRO.png" },
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
            { name: "Croix Rouge (non)", url: "https://i.postimg.cc/871gY92B/Croix-Rouge-(non).png" },
            { name: "BOX DELTA", url: "https://i.postimg.cc/VJGyQBL1/freebox-delta-1200x1200.png" },
            { name: "BOX ULTRA", url: "https://i.postimg.cc/QNBVhnhr/freebox-ultra.webp" }
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

        // --- 11. PALETTES COULEURS ---

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

    // Vérifier périodiquement les popups de cookies (toutes les 2 secondes)
    setInterval(autoAcceptCookies, 2000);
})();
