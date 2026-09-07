// ==UserScript==
// @name         Expert Editor Universal V4 + Footer dans le contenu
// @namespace    https://github.com/Steven17200
// @version      6.5.0
// @description  Analyse copie la news UF et ouvre HTML Tiny Editor + Archive.org + logos
// @author       Steven17200 (Modifié par Stéphane)
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://www.universfreebox.com/*
// @grant        GM_setClipboard
// @grant        GM_openInTab
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

    // Police d'icônes Font Awesome (suit la taille du texte, ex. 12pt)
    const FA_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    function injectFontAwesome(doc) {
        if (!doc) return;
        const root = doc.head || doc.documentElement;
        if (!root || root.querySelector('link[data-fa-expert]')) return;
        const faLink = doc.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = FA_CSS;
        faLink.setAttribute('data-fa-expert', '1');
        root.appendChild(faLink);
    }
    injectFontAwesome(document);

    function collectPageImages(root) {
        const urls = [];
        const seen = {};
        const add = (u) => {
            if (!u || typeof u !== 'string') return;
            u = u.trim();
            if (!u || u.indexOf('data:') === 0) return;
            u = u.split('?')[0];
            if (seen[u]) return;
            seen[u] = true;
            urls.push(u);
        };
        const og = document.querySelector('meta[property="og:image"]');
        if (og && og.getAttribute('content')) add(og.getAttribute('content'));
        const scope = root || document;
        scope.querySelectorAll('img').forEach((img) => {
            add(img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('src'));
        });
        return urls;
    }

    function extractArticleFromPage() {
        const titleEl = document.querySelector('h1.entry-title, h1');
        const title = titleEl ? titleEl.innerText.trim() : (document.title || '').trim();
        const dateEl = document.querySelector('time.date, time[datetime]');
        const date = dateEl ? (dateEl.innerText || dateEl.getAttribute('datetime') || '').trim() : '';
        const authorMeta = document.querySelector('meta[name="author"]');
        const authorLink = document.querySelector('.meta-author a, .author a');
        const author = (authorMeta && authorMeta.content) || (authorLink ? authorLink.innerText.trim() : '');
        const content = document.querySelector('.entry-content, article .content-wrapper, #post-' + (window.location.pathname.match(/\/article\/(\d+)/) || [])[1]);
        let body = '';
        const images = collectPageImages(content || document);
        if (content) {
            const clone = content.cloneNode(true);
            clone.querySelectorAll('script, style, noscript, iframe, .publicite, [id*="taboola"], [id*="ad"], .addtoany, .partage').forEach((n) => n.remove());
            body = (clone.innerText || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        }
        return {
            url: location.href,
            title: title,
            date: date,
            author: author,
            images: images,
            body: body
        };
    }

    function buildAnalyseClipboard(art) {
        const imgs = (art.images && art.images.length)
            ? art.images.map((u) => '- ' + u).join('\n')
            : '- (aucune)';
        return [
            'Rédige l\'article Tiny Editor (HTML + prompt audio SpaceXAI Voice) à partir de cette news Univers Freebox.',
            '',
            'URL : ' + art.url,
            'Titre : ' + (art.title || ''),
            'Date : ' + (art.date || ''),
            'Auteur : ' + (art.author || ''),
            '',
            'Images (photos réelles à réutiliser) :',
            imgs,
            '',
            '--- Texte de l\'article ---',
            art.body || '(contenu introuvable)'
        ].join('\n');
    }

    function copyTexte(texte) {
        try {
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(texte, 'text');
                return true;
            }
        } catch (e) {}
        try {
            navigator.clipboard.writeText(texte);
            return true;
        } catch (e2) {}
        return false;
    }

    const TINY_EDITOR_URL = 'https://grok.com/project/2c6808e9-cdc9-4059-b3bb-44bb2e416c6';

    function openTinyEditor() {
        try {
            if (typeof GM_openInTab === 'function') {
                GM_openInTab(TINY_EDITOR_URL, { active: true, insert: true, setParent: true });
                return true;
            }
        } catch (e) {}
        const w = window.open(TINY_EDITOR_URL, '_blank');
        return !!(w);
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

    // --- FONCTION POUR INSÉRER UN FOOTER DANS LE CONTENU (TinyMCE) ---
    function insertCustomFooterInContent(ed, downSpeed, upSpeed) {
        const footerHtml = `
            <div style="
                background: #e0e0e0;
                color: #000;
                padding: 8px 16px;
                display: flex;
                align-items: center;
                gap: 20px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                border-radius: 4px;
                margin: 10px 0;
                border: 1px solid #888;
                width: fit-content;
            ">
                <span>📶 <strong>Freebox Delta</strong></span>
                <span style="color: #4CAF50;">↓ <strong>${downSpeed}</strong></span>
                <span style="color: #2196F3;">↑ <strong>${upSpeed}</strong></span>
                <button onclick="alert('Historique des tests (à implémenter)')" style="
                    background: #444;
                    color: #fff;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">📊 Historique</button>
                <button onclick="window.open('https://www.universfreebox.com/test-de-debit', '_blank')" style="
                    background: #f44336;
                    color: #fff;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">⚡ Tester son débit</button>
            </div>
        `;
        ed.focus();
        ed.execCommand('mceInsertContent', false, footerHtml);
    }

    function autoAcceptCookies() {
        const cookieSelectors = [
            'button[aria-label*="accept" i]', 'button[aria-label*="cookie" i]',
            'button[id*="cookie" i]', 'button[id*="accept" i]', 'button[class*="cookie" i]',
            'button[class*="accept" i]', 'button[class*="consent" i]', 'button[class*="agree" i]',
            '#cookie-accept', '#cookie-consent-accept', '#accept-cookies', '#acceptAllCookies',
            '#cookie-ok', '#cookie-button', '.cookie-consent button', '.cookie-banner button',
            '.cookie-modal button', '.cookie-popup button', '.cookie-accept', '.cookie-accept-all',
            '.cookie-agree', '.cookie-ok', '.cookie-yes', '.cookie-allow', 'div[role="dialog"] button',
            'div[role="alertdialog"] button', 'iframe[src*="consent"]', 'iframe[src*="cookie"]'
        ];

        const clickCookieButton = () => {
            for (const selector of cookieSelectors) {
                const buttons = document.querySelectorAll(selector);
                for (const btn of buttons) {
                    if (btn.offsetParent !== null) {
                        const btnText = (btn.textContent || btn.innerText || '').toLowerCase();
                        const isAcceptButton =
                            btnText.includes('accept') || btnText.includes('ok') ||
                            btnText.includes('agree') || btnText.includes('allow') ||
                            btnText.includes('consent') || btnText.includes('tout accepter') ||
                            btnText.includes('tout autoriser') || btnText.includes('je suis d\'accord') ||
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

        if (clickCookieButton()) {
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
        if (autoAcceptCookies()) return;
        if (typeof tinyMCE !== 'undefined' && tinyMCE.editors && tinyMCE.editors.length > 0) {
            tinyMCE.editors.forEach(setupEditor);
        } else {
            setTimeout(init, 1000);
        }
    }

    function setupEditor(ed) {
        if (!ed.getContainer() || ed.getContainer().querySelector('.expert-editor-toolbar')) return;

        try { injectFontAwesome(ed.getDoc()); } catch (e) {}

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

        // --- 1. ANALYSE : copie la news + ouvre l'agent HTML Tiny Editor ---
        toolbar.appendChild(create('btn-ai-analyze', '🧐 Analyse', () => {
            const btn = document.getElementById('btn-ai-analyze');
            const art = extractArticleFromPage();
            if (!art.body && !art.title) {
                alert("❌ Impossible de lire l'article sur cette page.");
                return;
            }
            const texte = buildAnalyseClipboard(art);
            const okCopy = copyTexte(texte);
            const okOpen = openTinyEditor();
            if (btn) {
                btn.innerHTML = (okCopy && okOpen) ? '✅ Ouvert' : (okCopy ? '✅ Copié' : '❌');
                setTimeout(() => { btn.innerHTML = '🧐 Analyse'; }, 2000);
            }
            if (!okCopy) {
                prompt("Copie manuelle (Ctrl+C) :", texte);
            }
            if (!okOpen) {
                alert("News copiée. Autorise les pop-ups Tampermonkey, ou ouvre :\n" + TINY_EDITOR_URL);
            }
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

        // --- 5. CARACTÈRES SPÉCIAUX ---
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
                ed.execCommand('insertHTML', false, e.target.value);
                charSelect.selectedIndex = 0;
            }
        };
        toolbar.appendChild(charSelect);

        // --- 6. ÉDITION CLASSIQUE ---
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

        // --- 7. TABLEAUX ---
        toolbar.appendChild(create('btn-table', 'Tableau', () => {
            ed.focus();
            ed.execCommand('mceInsertTable');
        }));

        toolbar.appendChild(create('btn-table-gris', 'Tableau Gris', () => {
            ed.focus();
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

        // --- 8. CARACTÈRES SPÉCIAUX (FLÈCHES) ---
        toolbar.appendChild(create('btn-arrow-right', '→', () => ed.execCommand('mceInsertContent', false, '→')));
        toolbar.appendChild(create('btn-arrow-left', '←', () => ed.execCommand('mceInsertContent', false, '←')));
        toolbar.appendChild(create('btn-double-angle-right', '»', () => ed.execCommand('mceInsertContent', false, '»')));
        toolbar.appendChild(create('btn-double-angle-left', '«', () => ed.execCommand('mceInsertContent', false, '«')));

        // --- 9. ZONE DE CODE ---
        toolbar.appendChild(create('btn-code-zone', '💻 Code', () => {
            ed.focus();
            const codeHtml = `<pre style="background-color: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.5; overflow-x: auto; border: 1px solid #333; margin: 10px 0;"><code>// Votre code ici...</code></pre><p><br></p>`;
            ed.execCommand('mceInsertContent', false, codeHtml);
        }));

        // --- 10. LIENS & IMAGES ---
        toolbar.appendChild(create('btn-link', '🔗', () => {
            const url = prompt("Lien :");
            if (url) ed.execCommand('mceInsertLink', false, url);
        }));

        toolbar.appendChild(create('btn-image', '🖼️', () => {
            const url = prompt("URL de l'image :");
            if (!url) return;
            const width = prompt("Largeur (ex: 300px ou 50%) :", "100%");
            const height = prompt("Hauteur (ex: 200px ou auto) :", "auto");
            const borderWidth = prompt("Épaisseur du cadre (en pixels, ex: 2) :", "0");
            const borderColor = prompt("Couleur du cadre (ex: #000000 ou red) :", "#000000");
            const addLink = confirm("Voulez-vous que l'image soit cliquable ?");
            let linkUrl = null;
            if (addLink) {
                linkUrl = prompt("URL du lien (ex: https://example.com) :");
                if (!linkUrl) return;
            }
            let style = `max-width:100%;`;
            if (width) style += `width:${width};`;
            if (height) style += `height:${height};`;
            if (borderWidth && borderWidth !== "0") {
                style += `border:${borderWidth}px solid ${borderColor};`;
            }
            let imgHtml = `<img src="${url}" style="${style}">`;
            if (linkUrl) {
                const openInNewTab = confirm("Ouvrir le lien dans un nouvel onglet ?");
                const target = openInNewTab ? ' target="_blank"' : '';
                imgHtml = `<a href="${linkUrl}"${target}>${imgHtml}</a>`;
            }
            ed.execCommand('mceInsertContent', false, imgHtml);
        }));

        // --- 11. MÉDIAS ---
        toolbar.appendChild(create('btn-speedtest', '📊 Speedtest', () => {
            const url = prompt("Colle le lien Speedtest (ex: https://www.speedtest.net/result/a/11591345182) :");
            if (!url) return;
            const idMatch = url.match(/(?:result\/a\/|result\/)([a-zA-Z0-9]+)/);
            const id = idMatch ? idMatch[1] : null;
            if (!id) {
                alert("❌ ID non détecté. Vérifie le lien.");
                return;
            }
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

        toolbar.appendChild(create('btn-embed-webpage', '🌐 Page Web', () => {
            const url = prompt("URL de la page à intégrer (ex: https://boutique.canalplus.com/) :");
            if (!url) return;
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
        // --- Bouton YouTube Shorts ---
toolbar.appendChild(create('btn-yt-shorts', '🎥 Shorts', () => {
    const url = prompt("Lien YouTube Shorts (ex: https://www.youtube.com/shorts/abc123) :");
    if (!url) return;

    // Détection de l'ID (supporte shorts/, youtu.be/, v=, etc.)
    const idMatch = url.match(/(?:v=|\/|shorts\/|youtu\.be\/)([\w-]{11})/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) {
        alert("❌ ID YouTube non détecté. Vérifie le lien.");
        return;
    }

    // Choix du format
    const formatChoix = prompt(
        "Format pour YouTube Shorts :\n1 = Vertical (9:16 - Recommandé)\n2 = Carré (1:1)\n3 = Personnalisé",
        "1"
    );

    let width, height, style = "";
    if (formatChoix === "1") {
        // Format vertical (9:16)
        width = "300";
        height = "533";
        style = "max-width: 100%; height: auto; aspect-ratio: 9/16;";
    } else if (formatChoix === "2") {
        // Format carré (1:1)
        width = "300";
        height = "300";
        style = "max-width: 100%; height: auto; aspect-ratio: 1/1;";
    } else {
        // Personnalisé
        width = prompt("Largeur (pixels ou %) :", "100%") || "100%";
        height = prompt("Hauteur (pixels ou %) :", "56.25vw") || "56.25vw";
        style = "max-width: 100%;";
    }

    const autoplayChoix = prompt("Autoplay ? (1 = oui / 0 = non)", "1");
    const autoplay = (autoplayChoix === "1") ? "1" : "0";

    // URL de l'iframe (shorts utilise le même endpoint que les vidéos normales)
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
                style="border-radius:12px; background:#000; ${style}"
                allowfullscreen>
            </iframe>
        </div><p></p>`
    );

    const formatNom = (formatChoix === "1") ? "Vertical (9:16)" : (formatChoix === "2") ? "Carré (1:1)" : "Personnalisé";
    const status = (autoplay === "1") ? "avec autoplay" : "sans autoplay";
    alert(`✅ YouTube Shorts inséré (${formatNom}) ${status}. Le son peut demander un clic selon le navigateur.`);
}));

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

        toolbar.appendChild(create('btn-archive-org', '📼 Archive.org', () => {
            const url = prompt("Lien Archive.org (ex: https://archive.org/details/free-max-eddie-barclay) :");
            if (!url) return;
            const trimmed = url.trim();
            const idMatch = trimmed.match(/archive\.org\/(?:details|embed|download|stream)\/([^/?#]+)/i)
                || trimmed.match(/^([a-zA-Z0-9][a-zA-Z0-9._-]{1,100})$/);
            const id = idMatch ? decodeURIComponent(idMatch[1]) : null;
            if (!id) {
                alert("❌ Identifiant Archive.org non détecté. Vérifie le lien (ex: https://archive.org/details/free-max-eddie-barclay).");
                return;
            }
            const largeurStr = prompt("Largeur (pixels) ?", "560");
            let width = parseInt(largeurStr, 10) || 560;
            const hauteurStr = prompt("Hauteur (pixels) ?", "315");
            let height = parseInt(hauteurStr, 10) || 315;
            const autoPlayChoix = prompt("Lecture automatique ? (1 = oui / 0 = non)", "0");
            const autoplay = (autoPlayChoix === "1") ? "1" : "0";
            const loopChoix = prompt("En boucle ? (1 = oui / 0 = non)", "0");
            const loop = (loopChoix === "1") ? "1" : "0";
            const poster = `https://archive.org/services/img/${encodeURIComponent(id)}`;
            const iframeSrc = `https://archive.org/embed/${encodeURIComponent(id)}?autoplay=${autoplay}&loop=${loop}&poster=${encodeURIComponent(poster)}`;
            ed.focus();
            ed.execCommand('mceInsertContent', false,
                `<div style="display:flex;flex-direction:column;align-items:center;margin:15px 0;">
                    <iframe
                        width="${width}"
                        height="${height}"
                        src="${iframeSrc}"
                        frameborder="0"
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        style="border-radius:12px;background:#000;max-width:100%;"
                        allowfullscreen>
                    </iframe>
                </div><p></p>`
            );
            const statusAuto = (autoplay === "1") ? "avec autoplay" : "sans autoplay";
            const statusLoop = (loop === "1") ? "en boucle" : "sans boucle";
            alert(`✅ Archive.org inséré (${width}×${height}) ${statusAuto}, ${statusLoop}. Miniature intégrée.`);
        }));

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

        toolbar.appendChild(create('btn-flow-music', '🎶 Flow Music', () => {
            const url = prompt("Lien Flow Music (ex: https://www.flowmusic.app/song/f25d46e2-e58e-4e5f-a0a4-ab209126dadc) :");
            if (!url) return;
            const idMatch = url.match(/(?:song\/|\/song\/)([a-f0-9-]{36})/i);
            const songId = idMatch ? idMatch[1] : null;
            if (!songId) {
                alert("❌ ID de chanson non détecté. Vérifie le lien.");
                return;
            }
            const width = prompt("Largeur (pixels ou %) :", "100%");
            const height = prompt("Hauteur (pixels, ex: 120px) :", "120px");
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
            let embedUrl = url.replace("odysee.com/", "odysee.com/$/embed/");
            const orientation = prompt("Orientation ? (1: Horizontal, 2: Vertical)", "1") || "1";
            let w, h, styleW = "";
            if (orientation === "1") {
                const taille = prompt("Taille horizontale ? (1: 320, 2: 560, 3: 800, 4: 100%)", "2") || "2";
                if (taille === "1") { w = "320"; h = "180"; }
                else if (taille === "2") { w = "560"; h = "315"; }
                else if (taille === "2") { w = "800"; h = "450"; }
                else if (taille === "4") { w = "100%"; h = "450"; styleW = "width:100%; max-width:100%;"; }
            } else {
                const taille = prompt("Taille verticale ? (1: 180, 2: 315, 3: 450, 4: 100%)", "2") || "2";
                if (taille === "1") { w = "180"; h = "320"; }
                else if (taille === "2") { w = "315"; h = "560"; }
                else if (taille === "3") { w = "450"; h = "800"; }
                else if (taille === "4") { w = "100%"; h = "80vh"; styleW = "width:100%; max-width:560px;"; }
            }
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

        // --- 12. PUBLICATION HTML ---
        toolbar.appendChild(create('btn-html-frame', '📰 Publication HTML', () => {
            const htmlContent = prompt("Collez votre code HTML pour la publication :", "<p>Votre contenu ici...</p>");
            if (!htmlContent) return;
            const cleanHtml = htmlContent
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+="[^"]*"/g, '');
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

        // --- 13. LOGOS (Font Awesome + images, taille = police courante, ex. 12pt) ---
        const logoList = [
            { name: "📺 Logos", type: "label" },
            { name: "-- Font Awesome (suit le 12pt) --", type: "label" },
            { name: "YouTube", type: "fa", fa: "fa-brands fa-youtube", color: "#FF0000" },
            { name: "X (Twitter)", type: "fa", fa: "fa-brands fa-x-twitter", color: "#000000" },
            { name: "Facebook", type: "fa", fa: "fa-brands fa-facebook", color: "#1877F2" },
            { name: "Instagram", type: "fa", fa: "fa-brands fa-instagram", color: "#E4405F" },
            { name: "TikTok", type: "fa", fa: "fa-brands fa-tiktok", color: "#000000" },
            { name: "Twitch", type: "fa", fa: "fa-brands fa-twitch", color: "#9146FF" },
            { name: "Spotify", type: "fa", fa: "fa-brands fa-spotify", color: "#1DB954" },
            { name: "Discord", type: "fa", fa: "fa-brands fa-discord", color: "#5865F2" },
            { name: "Amazon / Prime", type: "fa", fa: "fa-brands fa-amazon", color: "#FF9900" },
            { name: "Apple", type: "fa", fa: "fa-brands fa-apple", color: "#555555" },
            { name: "Apple Music", type: "fa", fa: "fa-brands fa-itunes-note", color: "#FA243C" },
            { name: "Google", type: "fa", fa: "fa-brands fa-google", color: "#4285F4" },
            { name: "Wikipedia", type: "fa", fa: "fa-brands fa-wikipedia-w", color: "#000000" },
            { name: "Vimeo", type: "fa", fa: "fa-brands fa-vimeo-v", color: "#1AB7EA" },
            { name: "SoundCloud", type: "fa", fa: "fa-brands fa-soundcloud", color: "#FF5500" },
            { name: "OK (croix verte)", type: "fa", fa: "fa-solid fa-circle-check", color: "#2E7D32" },
            { name: "NON (croix rouge)", type: "fa", fa: "fa-solid fa-circle-xmark", color: "#C62828" },
            { name: "-- Chaînes & box (Wikipedia / Commons) --", type: "label" },
            { name: "TF1", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Logo_TF1_2013.svg/250px-Logo_TF1_2013.svg.png" },
            { name: "TF1+", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Logo_TF1%2B.svg/250px-Logo_TF1%2B.svg.png" },
            { name: "France 2", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/France_2_-_logo_2018.svg/250px-France_2_-_logo_2018.svg.png" },
            { name: "France 3", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/France_3_-_logo_2018.svg/250px-France_3_-_logo_2018.svg.png" },
            { name: "France 4", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/France_4_-_logo_2018.svg/250px-France_4_-_logo_2018.svg.png" },
            { name: "France 5", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/France_5_-_logo_2018.svg/250px-France_5_-_logo_2018.svg.png" },
            { name: "Arte", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Arte_Logo_2017.svg/250px-Arte_Logo_2017.svg.png" },
            { name: "Canal+", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Logo_Canal%2B_1995.svg/250px-Logo_Canal%2B_1995.svg.png" },
            { name: "M6", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Logo_M6_%282020%2C_fond_clair%29.svg/250px-Logo_M6_%282020%2C_fond_clair%29.svg.png" },
            { name: "M6+", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/M6%2B_%282024%29.svg/250px-M6%2B_%282024%29.svg.png" },
            { name: "W9", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/W9_2018.svg/250px-W9_2018.svg.png" },
            { name: "Molotov", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Logo_Molotov.tv.svg/250px-Logo_Molotov.tv.svg.png" },
            { name: "Netflix", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Netflix_icon.svg/250px-Netflix_icon.svg.png" },
            { name: "Disney+", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/250px-Disney%2B_logo.svg.png" },
            { name: "HBO", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/250px-HBO_logo.svg.png" },
            { name: "Apple TV", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Apple_TV_logo.svg/250px-Apple_TV_logo.svg.png" },
            { name: "Apple TV+", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Apple_TV_Plus_Logo.svg/250px-Apple_TV_Plus_Logo.svg.png" },
            { name: "Google TV", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Google_TV_logo.svg/250px-Google_TV_logo.svg.png" },
            { name: "Free", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Free_logo.svg/250px-Free_logo.svg.png" },
            { name: "Free Mobile", type: "img", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Logo_Free_Mobile.svg/250px-Logo_Free_Mobile.svg.png" }
        ];

        const logoSel = document.createElement('select');
        logoSel.style = "background:#180; color:#eee; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px; cursor:pointer; max-width:210px;";
        logoList.forEach((l, i) => {
            const o = document.createElement('option');
            o.textContent = l.name;
            if (l.type === "label") {
                o.value = "";
                o.disabled = i !== 0;
            } else if (l.type === "fa") {
                o.value = "fa:" + i;
                o.dataset.type = "fa";
                o.dataset.fa = l.fa;
                o.dataset.color = l.color || "#111";
            } else {
                o.value = l.url;
                o.dataset.type = "img";
            }
            logoSel.appendChild(o);
        });
        logoSel.onchange = (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            const type = opt && opt.dataset ? opt.dataset.type : "";
            if (!type) {
                e.target.selectedIndex = 0;
                return;
            }
            const size = (sizeSelect && sizeSelect.value) ? sizeSelect.value : "12pt";
            let html = "";
            if (type === "fa") {
                try { injectFontAwesome(ed.getDoc()); } catch (err) {}
                const bodyHtml = ed.getContent() || "";
                if (bodyHtml.indexOf("font-awesome") === -1) {
                    html += `<link rel="stylesheet" href="${FA_CSS}" />`;
                }
                html += `<i class="${opt.dataset.fa}" style="font-size:${size};color:${opt.dataset.color};vertical-align:-0.15em;margin:0 0.12em;line-height:1;" aria-hidden="true"></i>`;
            } else if (opt.value) {
                html = `<img src="${opt.value}" alt="${opt.textContent}" style="height:${size};width:auto;vertical-align:-0.15em;margin:0 0.12em;">`;
            }
            if (html) {
                ed.focus();
                ed.execCommand("mceInsertContent", false, html);
            }
            e.target.selectedIndex = 0;
        };
        toolbar.appendChild(logoSel);

        // --- 14. PALETTES COULEURS ---
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
            const cell = ed.dom.getParent(ed.selection.getStart(), 'td,th');
            if (cell) {
                ed.dom.setStyle(cell, 'background-color', color);
                ed.nodeChanged();
            } else {
                ed.execCommand('mceApplyTextcolor', 'backcolor', color);
            }
        };
        toolbar.appendChild(bgCasePicker);

        const clearHighlightBtn = create('btn-clear-highlight', '❌', () => {
            ed.focus();
            ed.execCommand('HiliteColor', false, 'transparent');
            const cell = ed.dom.getParent(ed.selection.getStart(), 'td,th');
            if (cell) ed.dom.setStyle(cell, 'background-color', '');
            ed.nodeChanged();
        });
        clearHighlightBtn.style = 'margin-left:8px; padding:4px 8px; font-size:14px;';
        toolbar.appendChild(clearHighlightBtn);

        // --- 15. BOUTON FOOTER (INTÉGRÉ DANS LE CONTENU) ---
        toolbar.appendChild(create('btn-custom-footer', '📊 Footer', () => {
            const downSpeed = prompt("Débit descendant (ex: 2.38 Gb/s) :", "2.38 Gb/s");
            if (!downSpeed) return;
            const upSpeed = prompt("Débit montant (ex: 2.17 Gb/s) :", "2.17 Gb/s");
            if (!upSpeed) return;
            insertCustomFooterInContent(ed, downSpeed, upSpeed);
        }));

        // Injection Toolbar
        container.insertBefore(toolbar, container.firstChild);
    }

    // Lancement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Vérifier périodiquement les popups de cookies
    setInterval(autoAcceptCookies, 12000);
})();
