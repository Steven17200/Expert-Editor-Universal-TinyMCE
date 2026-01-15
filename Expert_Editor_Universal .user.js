// ==UserScript==
// @name         Expert Editor Universal TinyMCE - ULTIMATE V4.8.5
// @namespace    https://github.com/Steven17200
// @version      4.8.5
// @description  Version Totale : YT Music Audio + Tailles + Styles + Couleurs + Shorts + Tableau Dynamique
// @author       Steven17200
// @icon         https://cdn-icons-png.flaticon.com/512/825/825590.png
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TEMPLATES = {
        1: `<div style="border-left: 5px solid #3498db; background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; color: #2c3e50;"><strong style="color: #2980b9;">ℹ️ INFO :</strong> Votre texte ici...</div>`,
        2: `<div style="border: 2px solid #e74c3c; background: #fdf2f2; padding: 15px; margin: 10px 0; border-radius: 4px; color: #c0392b;"><strong>⚠️ ALERTE :</strong> Message important...</div>`,
        3: `<table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;"><tr style="background:#eee;"><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Titre 1</td><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Titre 2</td></tr><tr><td style="padding:8px; border:1px solid #ddd;">Donnée 1</td><td style="padding:8px; border:1px solid #ddd;">Donnée 2</td></tr></table>`
    };

    function init() {
        // Vérifie si tinyMCE existe globalement
        if (typeof tinyMCE !== 'undefined' && tinyMCE.editors && tinyMCE.editors.length > 0) {
            tinyMCE.editors.forEach(setupEditor);
        } else {
            // Re-tente l'initialisation après 1 seconde si l'éditeur n'est pas prêt
            setTimeout(init, 1000);
        }
    }

    function setupEditor(ed) {
        // Évite les doublons de barre d'outils
        if (!ed.getContainer() || ed.getContainer().querySelector('.expert-editor-toolbar')) return;

        const container = ed.getContainer();
        if (container) {
            const toolbar = document.createElement('div');
            toolbar.className = 'expert-editor-toolbar';
            // Style de la barre d'outils [cite: 6, 7]
            toolbar.style = "background: #f1f1f1; border-bottom: 1px solid #ccc; padding: 5px; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; justify-content: flex-start; z-index: 9999;";

            const create = (id, text, onClick) => {
                const btn = document.createElement('button');
                btn.id = id;
                btn.innerHTML = text;
                btn.type = 'button';
                // Style des boutons [cite: 8, 9]
                btn.style = "padding: 4px 8px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; font-family: sans-serif; color: #000;";
                btn.onclick = onClick;
                return btn;
            };

            // 1. TAILLE DE POLICE (6pt-72pt) [cite: 10, 11]
            const sizeSelect = document.createElement('select');
            sizeSelect.style = "padding: 3px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; font-size: 12px;";
            const sizes = ['6pt', '8pt', '10pt', '12pt', '14pt', '18pt', '24pt', '36pt', '48pt', '72pt'];
            sizes.forEach(size => {
                const opt = document.createElement('option');
                opt.value = size; opt.innerHTML = size;
                if(size === '12pt') opt.selected = true; // [cite: 12]
                sizeSelect.appendChild(opt);
            });
            sizeSelect.onchange = () => { ed.focus(); ed.execCommand('FontSize', false, sizeSelect.value); };
            toolbar.appendChild(sizeSelect);

            // 2. MODÈLES [cite: 12, 13]
            toolbar.appendChild(create('btn-tpl-1', 'Info', () => { ed.focus(); ed.execCommand('mceInsertContent', false, TEMPLATES[1]); }));
            toolbar.appendChild(create('btn-tpl-2', 'Alerte', () => { ed.focus(); ed.execCommand('mceInsertContent', false, TEMPLATES[2]); }));

            // --- GÉNÉRATEUR DE TABLEAU DYNAMIQUE ---
            toolbar.appendChild(create('btn-grid', '📅 Table', () => {
                const rows = prompt("Nombre de lignes :", "3");
                const cols = prompt("Nombre de colonnes :", "3");
                if (rows && cols) {
                    let tableHtml = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ccc; margin: 10px 0;">';
                    for (let r = 0; r < rows; r++) {
                        tableHtml += '<tr>';
                        for (let c = 0; c < cols; c++) {
                            const isHeader = r === 0;
                            const tag = isHeader ? 'th' : 'td';
                            const style = `padding: 8px; border: 1px solid #ccc; ${isHeader ? 'background: #f2f2f2; font-weight: bold;' : ''}`;
                            tableHtml += `<${tag} style="${style}">${isHeader ? 'Titre' : 'Cellule'}</${tag}>`;
                        }
                        tableHtml += '</tr>';
                    }
                    tableHtml += '</table><p></p>';
                    ed.focus();
                    ed.execCommand('mceInsertContent', false, tableHtml);
                }
            }));

            // 3. STYLES SPÉCIAUX [cite: 14, 15, 16, 17]
            toolbar.appendChild(create('btn-font-tr', 'TR', () => {
                ed.focus(); const sel = ed.selection.getContent();
                ed.execCommand('mceInsertContent', false, `<span style="color:#ff4500; font-family:Impact; text-transform:uppercase; font-style:italic;">${sel || 'TR'}</span>`);
            }));
            toolbar.appendChild(create('btn-font-t8', 'T8', () => {
                ed.focus(); const sel = ed.selection.getContent();
                ed.execCommand('mceInsertContent', false, `<span style="color:#ff0000; font-family:monospace; font-weight:bold; text-shadow:0 0 5px red;">${sel || 'T8'}</span>`);
            }));
            toolbar.appendChild(create('btn-font-humain', 'Humain', () => {
                ed.focus(); const sel = ed.selection.getContent();
                ed.execCommand('mceInsertContent', false, `<span style="font-family:'Comic Sans MS', cursive, sans-serif;">${sel || 'Texte'}</span>`);
            }));
            toolbar.appendChild(create('btn-font-small', 'Petit', () => {
                ed.focus(); const sel = ed.selection.getContent();
                ed.execCommand('mceInsertContent', false, `<span style="font-size: 8pt;">${sel || 'Petit'}</span>`);
            }));

            // 4. COULEURS [cite: 18, 19]
            const cols = [{n:'N',c:'#000'},{n:'R',c:'#e74c3c'},{n:'B',c:'#3498db'},{n:'V',c:'#27ae60'},{n:'O',c:'#ff9800'},{n:'VI',c:'#8e44ad'},{n:'VF',c:'#1b5e20'},{n:'BF',c:'#0d47a1'},{n:'BL',c:'#fff'}];
            cols.forEach(col => {
                const b = create('btn-col-'+col.n, col.n, () => { ed.focus(); ed.execCommand('ForeColor', false, col.c); });
                if(col.n === 'Bl') b.style.border = "1px solid #aaa";
                toolbar.appendChild(b);
            });

            // 5. MÉDIAS (YT, Music, SC, Shorts) [cite: 20, 21, 22, 23, 24, 25, 26, 27]
            toolbar.appendChild(create('btn-yt-std', '📺 YT', () => {
                const url = prompt("Lien YouTube Standard :");
                const id = url ? url.match(/(?:v=|\/embed\/|youtu.be\/)([\w-]+)/)?.[1] : null;
                if(id){
                    const w = prompt("Largeur :", "560"), h = prompt("Hauteur :", "315");
                    ed.focus(); ed.execCommand('mceInsertContent', false, `<iframe width="${w}" height="${h}" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`);
                }
            }));
            toolbar.appendChild(create('btn-yt-music', '🎵 Music', () => {
                const url = prompt("Lien YouTube Music :");
                const id = url ? url.match(/(?:v=|\/watch\?v=|youtu.be\/)([\w-]+)/)?.[1] : null;
                if(id){
                    ed.focus();
                    ed.execCommand('mceInsertContent', false, `<div style="margin:10px 0;"><iframe width="100%" height="60" src="https://www.youtube.com/embed/${id}?controls=1&modestbranding=1" frameborder="0" style="border-radius:8px; background:#000;"></iframe></div><p></p>`);
                }
            }));
            toolbar.appendChild(create('btn-sc', '☁️ SC', () => {
                const url = prompt("Lien SoundCloud :");
                if(url){
                    ed.focus();
                    ed.execCommand('mceInsertContent', false, `<iframe width="100%" height="120" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&visual=false"></iframe><p></p>`);
                }
            }));
            toolbar.appendChild(create('btn-yt-shorts', '🎬 SHORTS', () => {
                const url = prompt("Lien YouTube Short :");
                const id = url ? url.match(/(?:\/shorts\/|v=)([\w-]+)/)?.[1] : null;
                if(id){
                    ed.focus();
                    ed.execCommand('mceInsertContent', false, `<div style="display:flex; justify-content:center; margin:15px 0;"><iframe width="315" height="560" src="https://www.youtube.com/embed/${id}" style="border-radius:12px; border:none; object-fit:cover; aspect-ratio:9/16; background:#000;" allowfullscreen></iframe></div><p></p>`);
                }
            }));

            // Insertion finale [cite: 28]
            container.insertBefore(toolbar, container.firstChild);
        }
    }

    // Lancement du script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
