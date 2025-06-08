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

    const findNextButton = () => {
        // Versucht, verschiedene Varianten des "Weiter"-Buttons zu finden
        const selectors = [
            'button[data-e2e="arrow-right"]',
            'button[aria-label*="weiter" i]',
            'button[aria-label*="next" i]'
        ];
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn) return btn;
        }
        return Array.from(document.querySelectorAll('button')).find(b => /weiter/i.test(b.textContent));
    };

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
            // Wenn keine Follow-Buttons mehr da sind, versuche den Weiter-Button
            const nextBtn = findNextButton();
            if (nextBtn) {
                nextBtn.click();
                console.log('Weiter-Button geklickt.');
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                // Fallback: Scrollen, um mehr Buttons zu laden
                container.scrollTop = container.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            clickLoop();
        }
    };

    clickLoop();
}

function stopClicking() {
    isFollowingStopped = true;
    console.log("Stopp-Signal für das Folgen gesendet.");
}


// ## SCROLL FUNKTIONEN (ÜBERARBEITET NACH URSPRÜNGLICHER LOGIK) ##

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
        // 1. Klicke auf das Symbol des "Nächstes Video"-Buttons und ermittle den eigentlichen Button
        const nextButtonIcon = document.querySelector('#main-content-homepage_hot > aside > div > div:nth-child(2) > button > div');
        const parentButton = nextButtonIcon ? nextButtonIcon.closest('button') : null;
        if (!parentButton) {
            console.error("Nächstes-Video-Button nicht gefunden. Scroll wird gestoppt.");
            stopAutoScroll();
            return;
        }
        parentButton.click();
        console.log("Zum nächsten Video gescrollt.");

        scrollCount++;
        chrome.runtime.sendMessage({ type: "scroll-update", count: scrollCount });
        chrome.storage.local.set({ scrollCount });

        // 2. Warte kurz, damit die Seite und die Video-Elemente laden können
        setTimeout(() => {
            // 3. Finde das aktuell sichtbare Video-Element. TikTok lädt mehrere Video-Karten
            // in den DOM. Wir müssen die richtige finden, um Aktionen auszuführen.
            const videoCards = document.querySelectorAll('div[data-e2e="recommend-list-item-container"]');
            
            // Diese Schleife geht die geladenen Videos durch. Oft ist das zweite oder dritte
            // Element das aktive, nachdem gescrollt wurde.
            for (let i = 0; i < videoCards.length; i++) {
                const card = videoCards[i];
                let interactionSuccessful = false;

                // Führe Like-Aktion mit Zufallswahrscheinlichkeit aus
                if (autoLike && Math.random() < likeChance) {
                    const likeButton = card.querySelector('button[data-e2e="like-button"]');
                    if (likeButton) {
                        likeButton.click();
                        console.log("Video geliked (zufällig).");
                        interactionSuccessful = true;
                    }
                }
                
                // Führe Speicher-Aktion mit Zufallswahrscheinlichkeit aus
                if (autoSave && Math.random() < saveChance) {
                     const saveButton = card.querySelector('button[data-e2e="favorite-button"]');
                     if (saveButton) {
                         saveButton.click();
                         console.log("Video gespeichert (zufällig).");
                         interactionSuccessful = true;
                     }
                }

                // Wenn eine Aktion erfolgreich war, stoppen wir die Suche für dieses Video.
                if(interactionSuccessful) {
                    break;
                }
            }
        }, 2500); // Leicht erhöhte Wartezeit für mehr Stabilität

        // 4. Plane den nächsten Scroll-Vorgang mit zufälliger Verzögerung
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
