// ==UserScript==
// @name         Portainer Auto-login
// @namespace    https://github.com/Steven17200/
// @version      2.0
// @description  Remplit automatiquement l'identifiant et le mot de passe pour Portainer et se connecte. Le mot de passe est mémorisé de manière sécurisée par Tampermonkey.
// @author       Steven17200
// @match        http://192.168.1.100:9000/*
// @icon         https://www.portainer.io/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @connect      self
// ==/UserScript==

(function() {
    'use strict';

    // Clé de stockage pour les identifiants
    const STORAGE_KEY = 'portainer_credentials';

    // Fonction pour récupérer les identifiants sauvegardés
    const getCredentials = () => {
        const saved = GM_getValue(STORAGE_KEY, null);
        if (saved) {
            return saved;
        }
        // Valeurs par défaut (seront sauvegardées après première utilisation)
        return {
            username: 'admin',
            password: ''
        };
    };

    // Fonction pour sauvegarder les identifiants
    const saveCredentials = (username, password) => {
        GM_setValue(STORAGE_KEY, {
            username: username,
            password: password
        });
    };

    // Fonction pour demander à l'utilisateur de configurer les identifiants
    const promptForCredentials = () => {
        const username = prompt('Entrez votre nom d\'utilisateur Portainer:', 'admin');
        if (username === null) return null; // Annulé
        
        const password = prompt('Entrez votre mot de passe Portainer:');
        if (password === null) return null; // Annulé
        
        if (username && password) {
            saveCredentials(username, password);
            return { username, password };
        }
        return null;
    };

    // Fonction principale de connexion automatique
    const autoLogin = setInterval(() => {
        const userField = document.querySelector('input[id="username"]');
        const passField = document.querySelector('input[id="password"]');
        const loginButton = document.querySelector('button[type="submit"]');

        // Si tous les éléments sont présents sur la page
        if (userField && passField && loginButton) {
            clearInterval(autoLogin);

            let credentials = getCredentials();
            
            // Si aucun mot de passe n'est sauvegardé, demander à l'utilisateur
            if (!credentials.password) {
                credentials = promptForCredentials();
                if (!credentials) return; // Annulé par l'utilisateur
            }

            // Remplissage des valeurs
            userField.value = credentials.username;
            passField.value = credentials.password;

            // Notification au framework Portainer du changement de texte
            userField.dispatchEvent(new Event('input', { bubbles: true }));
            passField.dispatchEvent(new Event('input', { bubbles: true }));

            // Délai de sécurité avant le clic
            setTimeout(() => {
                loginButton.click();
            }, 1000);
        }
    }, 200); // Vérification toutes les 200ms
})();
