// Diese Datei wird nicht direkt geladen. Ihre Funktionen werden von popup.js injiziert.

// ## FOLLOW FUNKTIONEN ##

// Globale Variable, um den Follow-Prozess zu steuern
let isFollowingStopped = false;

function clickFollowButtonsWithScroll(maxClicks, delay) {
    isFollowingStopped = false; // Zurücksetzen beim Start
    const containerSelector = 'div[data-e2e="recommend-list-container"]';
    const container = document.querySelector(containerSelector);

    if (!container) {
        console.error("Follow-Container nicht gefunden.");
        return;
    }

    let clickCount = 0;

    const clickLoop = async () => {
        if (clickCount >= maxClicks || isFollowingStopped) {
            console.log("Follow-Aktion beendet.");
            return;
        }

        const buttons = container.querySelectorAll('button[data-e2e="follow-button"]');
        if (buttons.length > 0) {
            const button = buttons[0]; // Immer den ersten verfügbaren Button nehmen
            button.click();
            clickCount++;
            
            // Update an das Popup senden
            chrome.runtime.sendMessage({ type: "click-update", count: clickCount });
            chrome.storage.local.set({ clickCount }); // Im Speicher sichern

            // Warten, bevor der nächste Klick erfolgt
            await new Promise(resolve => setTimeout(resolve, delay));
            clickLoop();
        } else {
            // Scrollen, um mehr Buttons zu laden
            container.scrollTop = container.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Warten, bis neue Inhalte geladen sind
            clickLoop();
        }
    };

    clickLoop();
}

function stopClicking() {
    isFollowingStopped = true;
    console.log("Stopp-Signal für das Folgen gesendet.");
}


// ## SCROLL FUNKTIONEN ##

// Globale Variable für das Scroll-Timeout
let scrollTimeoutId = null;

/**
 * Startet das automatische Scrollen mit zufälligen Intervallen und Aktionen.
 * @param {boolean} autoLike - Ob das Liken aktiviert ist.
 * @param {boolean} autoSave - Ob das Speichern aktiviert ist.
 * @param {number} baseInterval - Das Basisintervall in Millisekunden.
 * @param {number} randomDelay - Die maximale zufällige Verzögerung, die zum Basisintervall addiert wird.
 * @param {number} likeChance - Die Wahrscheinlichkeit (0 bis 1), ein Video zu liken.
 * @param {number} saveChance - Die Wahrscheinlichkeit (0 bis 1), ein Video zu speichern.
 */
function startAutoScroll(autoLike, autoSave, baseInterval, randomDelay, likeChance, saveChance) {
    if (scrollTimeoutId) return; // Verhindert mehrere Schleifen

    let scrollCount = 0;
    chrome.storage.local.get('scrollCount', (result) => {
        scrollCount = result.scrollCount || 0;
    });

    const scrollLoop = () => {
        // Nächstes Video-Button
        const nextButton = document.querySelector('button[data-e2e="arrow-right"]');
        if (!nextButton) {
            console.error("Nächstes-Video-Button nicht gefunden.");
            stopAutoScroll();
            return;
        }
        
        // Aktionen für das *aktuelle* Video durchführen, *bevor* gescrollt wird
        const currentVideoContainer = document.querySelector('div[data-e2e="player-container"]');
        if(currentVideoContainer) {
            // Zufälliges Liken basierend auf der Wahrscheinlichkeit
            if (autoLike && Math.random() < likeChance) {
                const likeButton = currentVideoContainer.querySelector('button[data-e2e="like-button"]');
                if (likeButton) {
                    likeButton.click();
                    console.log("Video geliked (zufällig).");
                }
            }
            // Zufälliges Speichern basierend auf der Wahrscheinlichkeit
            if (autoSave && Math.random() < saveChance) {
                 const saveButton = currentVideoContainer.querySelector('button[data-e2e="favorite-button"]');
                 if (saveButton) {
                     saveButton.click();
                     console.log("Video gespeichert (zufällig).");
                 }
            }
        }
        
        // Zum nächsten Video scrollen
        nextButton.click();

        scrollCount++;
        chrome.runtime.sendMessage({ type: "scroll-update", count: scrollCount });
        chrome.storage.local.set({ scrollCount });

        // Berechnet die nächste Verzögerung. Sie besteht aus der Basiszeit plus einer zufälligen Zeit.
        const nextDelay = baseInterval + (Math.random() * randomDelay);
        console.log(`Nächster Scroll in ${(nextDelay / 1000).toFixed(2)} Sekunden.`);
        
        // Plant den nächsten Aufruf der Funktion
        scrollTimeoutId = setTimeout(scrollLoop, nextDelay);
    };

    scrollLoop(); // Startet die Schleife zum ersten Mal
}

function stopAutoScroll() {
    if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId); // Stoppt den geplanten nächsten Scroll
        scrollTimeoutId = null;
        console.log("Auto-Scroll gestoppt.");
    }
}
