// Diese Datei wird nicht direkt geladen. Ihre Funktionen werden von popup.js injiziert.

// ## FOLLOW FUNKTIONEN ##

// Globale Variable, um den Follow-Prozess zu steuern
let isFollowingStopped = false;

function clickFollowButtonsWithScroll(maxClicks, delay) {
    isFollowingStopped = false; // Zurücksetzen beim Start
    const containerSelector = '#tux-portal-container > div > div:nth-child(2) > div > div > div.css-17s26nl-ModalContentContainer.e1wuf0b31 > div > div > section > div > div.css-wq5jjc-DivUserListContainer.eorzdsw0';
    const container = document.querySelector(containerSelector);

    if (!container) {
        console.error("Follow-Container nicht gefunden.");
        return;
    }

    let clickCount = 0;

    const getButtons = () => document.querySelectorAll('button[data-e2e="follow-button"]');

    const findNextButton = () => {
        const selectors = [
            'button[data-e2e="arrow-right"]',
            'button[aria-label*="weiter" i]',
            'button[aria-label*="next" i]'
        ];
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn) return btn;
        }
        return Array.from(document.querySelectorAll('button')).find(b => /weiter|next/i.test(b.textContent));
    };

    const clickButton = () => {
        if (clickCount < maxClicks && !isFollowingStopped) {
            const buttons = getButtons();
            if (buttons.length > 0) {
                const button = buttons[clickCount % buttons.length];
                if (button) {
                    try {
                        button.click();
                        clickCount++;
                        chrome.runtime.sendMessage({ type: "click-update", count: clickCount });
                        chrome.storage.local.set({ clickCount });
                    } catch (error) {
                        console.error("Fehler beim Klicken:", error);
                    }
                    if (clickCount % 8 === 0) {
                        container.scrollBy({ top: 550, behavior: 'smooth' });
                        setTimeout(clickButton, 1500);
                    } else {
                        setTimeout(clickButton, delay);
                    }
                } else {
                    console.log("Kein Button verfügbar.");
                    setTimeout(clickButton, delay);
                }
            } else {
                const nextBtn = findNextButton();
                if (nextBtn) {
                    nextBtn.click();
                    console.log('Weiter-Button geklickt.');
                    setTimeout(clickButton, 2000);
                } else {
                    container.scrollBy({ top: 550, behavior: 'smooth' });
                    setTimeout(clickButton, 2000);
                }
            }
        } else {
            console.log("Clics terminés.");
        }
    };

    clickButton();

    window.stopClicking = () => {
        isFollowingStopped = true;
    };
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
        // 1. Klicke auf den "Nächstes Video"-Button
        // Wir verwenden einen robusten Selector, der in den meisten TikTok-Versionen funktioniert
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
