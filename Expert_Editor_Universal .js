// ==UserScript==
// @name         Expert Editor Universal TinyMCE
// @namespace    https://github.com/Steven17200
// @version      3.2
// @description  Barre d'outils complète : Zoom, Couleurs (NRBV), Manuscrit, YT & SoundCloud Minimaliste
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @icon         https://www.universfreebox.com/favicon.ico
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. CSS COMPLET ---
    const style = document.createElement('style');
    style.innerHTML = `
        .mce-btn-custom button { border-radius: 4px !important; border: none !important; margin-left: 2px; transition: transform 0.1s, opacity 0.2s; padding: 2px 6px !important; min-width: 28px; height: 24px; }
        .mce-btn-custom span { color: #fff !important; font-weight: bold !important; font-size: 11px; line-height: 20px; }
        .mce-btn-custom:hover { opacity: 0.8; transform: scale(1.05); }

        /* Couleurs et identité des boutons */
        #btn-zoom-fixed button { background: #7f8c8d !important; }
        #btn-human-font button { background: #9b59b6 !important; }
        #btn-text-black button { background: #2c3e50 !important; }
        #btn-text-red button   { background: #e74c3c !important; }
        #btn-text-blue button  { background: #3498db !important; }
        #btn-text-green button { background: #27ae60 !important; }
        #btn-video-yt button   { background: #ff0000 !important; }
        #btn-sc-custom button  { background: #ff5500 !important; }
        #btn-list-num button, #btn-list-dots button, #btn-table-custom button { background: #555 !important; }
    `;
    document.head.appendChild(style);

    // --- 2. LOGIQUE UNIVERSELLE ---
    function getEditor() {
        // Détecte automatiquement l'instance TinyMCE active sur la page
        return window.tinyMCE ? window.tinyMCE.activeEditor : null;
    }

    let sizeLevel = 0;
    const fontSizes = ['14px', '18px', '24px', '30px', '36px'];
    const labels = ['A', 'A+', 'A++', 'A+++', 'MAX'];

    function toggleZoom(e) {
        e.preventDefault();
        const ed = getEditor();
        if (!ed) return;
        sizeLevel = (sizeLevel + 1) % fontSizes.length;
        ed.execCommand('FontSize', false, fontSizes[sizeLevel]);
        const btn = document.querySelector('#btn-zoom-fixed span');
        if (btn) btn.innerText = labels[sizeLevel];
    }

    function insertMedia(type) {
        const ed = getEditor();
        if (!ed) return;
        const url = prompt(type === 'yt' ? "Lien YouTube/Dailymotion :" : "Lien SoundCloud :");
        if (!url) return;

        let html = "";
        if (type === 'yt') {
            let width = prompt("Largeur (px) :", "560");
            let height = Math.round((width * 315) / 560);
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^"&?\/\s]{11})/);
            if (match) html = `<p><iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe></p>`;
        } else {
            const cleanUrl = encodeURIComponent(url.split('?')[0]);
            html = `<p><iframe width="100%" height="20" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=${cleanUrl}&color=%23ff5500&inverse=false"></iframe></p>`;
        }
        if (html) ed.execCommand('mceInsertContent', false, html);
    }

    // --- 3. INJECTION DYNAMIQUE ---
    function inject() {
        const ed = getEditor();
        if (!ed) return;

        const toolbar = document.querySelector('.mce-container-body.mce-flow-layout .mce-container-body.mce-flow-layout') ||
                        document.querySelector('.mce-container-body.mce-flow-layout');

        if (toolbar && !document.getElementById('btn-zoom-fixed')) {
            const create = (id, label, f, title = "") => {
                const d = document.createElement('div');
                d.id = id;
                d.className = 'mce-widget mce-btn mce-btn-custom';
                d.setAttribute('title', title);
                d.innerHTML = `<button type="button"><span>${label}</span></button>`;
                d.addEventListener('mousedown', (e) => { e.preventDefault(); f(e); });
                return d;
            };

            // Structure & Médias
            toolbar.appendChild(create('btn-list-num', '1.', () => ed.execCommand('InsertOrderedList'), "Liste numérotée"));
            toolbar.appendChild(create('btn-list-dots', '•', () => ed.execCommand('InsertUnorderedList'), "Liste à puces"));
            toolbar.appendChild(create('btn-table-custom', '田', () => ed.execCommand('mceInsertContent', false, '<table style="border-collapse:collapse;width:100%;border:1px solid black;"><tr><td style="border:1px solid black;padding:8px;">&nbsp;</td></tr></table>'), "Tableau"));
            toolbar.appendChild(create('btn-video-yt', 'YT', () => insertMedia('yt'), "Vidéo"));
            toolbar.appendChild(create('btn-sc-custom', 'SC', () => insertMedia('sc'), "SoundCloud Mini"));

            // Zoom & Style
            toolbar.appendChild(create('btn-zoom-fixed', 'A', toggleZoom, "Zoom"));
            toolbar.appendChild(create('btn-human-font', '✎', () => {
                const sel = ed.selection.getContent();
                if (sel) ed.execCommand('mceInsertContent', false, `<span style="font-family:'Comic Sans MS',cursive;font-size:1.1em;">${sel}</span>`);
            }, "Manuscrit"));

            // Palette NRBV
            toolbar.appendChild(create('btn-text-black', 'N', () => ed.execCommand('ForeColor', false, '#000000'), "Noir"));
            toolbar.appendChild(create('btn-text-red', 'R', () => ed.execCommand('ForeColor', false, '#e74c3c'), "Rouge"));
            toolbar.appendChild(create('btn-text-blue', 'B', () => ed.execCommand('ForeColor', false, '#3498db'), "Bleu"));
            toolbar.appendChild(create('btn-text-green', 'V', () => ed.execCommand('ForeColor', false, '#27ae60'), "Vert"));
        }
    }

    // Vérification périodique pour gérer les chargements asynchrones de l'éditeur
    setInterval(inject, 2000);
})();
