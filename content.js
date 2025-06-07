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


// ## SCROLL FUNKTIONEN (ÜBERARBEITET) ##

// Globale Variable für das Scroll-Timeout
let scrollTimeoutId = null;

function startAutoScroll(autoLike, autoSave, baseInterval, randomDelay, likeChance, saveChance) {
    if (scrollTimeoutId) {
        console.log("Scroll-Prozess läuft bereits.");
        return;
    }

    let scrollCount = 0;
    chrome.storage.local.get('scrollCount', (result) => {
        scrollCount = result.scrollCount || 0;
    });

    const scrollLoop = () => {
        // 1. Nächstes Video-Button finden und klicken
        const nextButton = document.querySelector('button[data-e2e="arrow-right"]');
        if (!nextButton) {
            console.error("Nächstes-Video-Button nicht gefunden. Scroll wird gestoppt.");
            stopAutoScroll();
            return;
        }
        nextButton.click();
        console.log("Zum nächsten Video gescrollt.");

        scrollCount++;
        chrome.runtime.sendMessage({ type: "scroll-update", count: scrollCount });
        chrome.storage.local.set({ scrollCount });

        // 2. Eine feste Verzögerung einplanen, damit das Video laden kann
        setTimeout(() => {
            const currentVideoContainer = document.querySelector('div[data-e2e="player-container"]');
            if(currentVideoContainer) {
                // 3. Aktionen (Liken/Speichern) mit Zufallswahrscheinlichkeit ausführen
                if (autoLike && Math.random() < likeChance) {
                    const likeButton = currentVideoContainer.querySelector('button[data-e2e="like-button"]');
                    if (likeButton) {
                        likeButton.click();
                        console.log("Video geliked (zufällig).");
                    }
                }
                if (autoSave && Math.random() < saveChance) {
                     const saveButton = currentVideoContainer.querySelector('button[data-e2e="favorite-button"]');
                     if (saveButton) {
                         saveButton.click();
                         console.log("Video gespeichert (zufällig).");
                     }
                }
            }
        }, 2000); // 2 Sekunden Wartezeit, um Aktionen nach dem Scrollen zu ermöglichen

        // 4. Den nächsten Scroll mit zufälliger Verzögerung planen
        const nextDelay = baseInterval + (Math.random() * randomDelay);
        console.log(`Nächster Scroll in ${(nextDelay / 1000).toFixed(2)} Sekunden.`);
        
        scrollTimeoutId = setTimeout(scrollLoop, nextDelay);
    };

    scrollLoop(); // Die Schleife zum ersten Mal starten
}

function stopAutoScroll() {
    if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
        scrollTimeoutId = null;
        console.log("Auto-Scroll gestoppt.");
    }
}
