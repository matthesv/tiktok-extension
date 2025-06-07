document.addEventListener('DOMContentLoaded', () => {
    // Tab-Management
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Zustandvariablen
    let clickDelay = 2000;

    // UI-Elemente
    const elements = {
        clickCounter: document.getElementById('clickCounter'),
        scrollCounter: document.getElementById('scrollCounter'),
        speedButton: document.getElementById('speedButton'),
        stopButton: document.getElementById('stopButton'),
        startScrollButton: document.getElementById('startScrollButton'),
        stopScrollButton: document.getElementById('stopScrollButton'),
        resetScrollCountButton: document.getElementById('resetScrollCountButton'),
        autoLikeCheckbox: document.getElementById('autoLike'),
        autoSaveCheckbox: document.getElementById('autoSave'),
        baseIntervalInput: document.getElementById('baseIntervalInput'),
        randomDelayInput: document.getElementById('randomDelayInput'),
        likeChanceSlider: document.getElementById('likeChanceSlider'),
        saveChanceSlider: document.getElementById('saveChanceSlider'),
        likeChanceValue: document.getElementById('likeChanceValue'),
        saveChanceValue: document.getElementById('saveChanceValue'),
    };
    
    // Initialisierung der Zähler
    chrome.storage.local.get(['clickCount', 'scrollCount'], (result) => {
        elements.clickCounter.textContent = result.clickCount || 0;
        elements.scrollCounter.textContent = result.scrollCount || 0;
    });

    // Funktion zum Ausführen von Skripten
    function executeScript(func, args = []) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: func,
                args: args
            }).catch(err => console.error("Skript-Fehler:", err));
        });
    }

    // --- Follow-Funktionen ---
    [10, 25].forEach(count => {
        document.getElementById(`clickButton${count}`).addEventListener('click', () => {
            executeScript(clickFollowButtonsWithScroll, [count, clickDelay]);
        });
    });

    elements.speedButton.addEventListener('click', () => {
        clickDelay = (clickDelay === 2000) ? 1000 : 2000;
        elements.speedButton.innerHTML = `<i class="fas fa-tachometer-alt"></i> ${clickDelay === 1000 ? 'Fast' : 'Normal'}`;
    });

    elements.stopButton.addEventListener('click', () => executeScript(stopClicking));

    // --- Scroll-Funktionen ---
    elements.startScrollButton.addEventListener('click', () => {
        const autoLike = elements.autoLikeCheckbox.checked;
        const autoSave = elements.autoSaveCheckbox.checked;

        const baseInterval = parseInt(elements.baseIntervalInput.value, 10) * 1000;
        const randomDelay = parseInt(elements.randomDelayInput.value, 10) * 1000;
        const likeChance = parseInt(elements.likeChanceSlider.value, 10) / 100;
        const saveChance = parseInt(elements.saveChanceSlider.value, 10) / 100;
        
        if (isNaN(baseInterval) || isNaN(randomDelay) || baseInterval <= 0) {
            alert("Bitte geben Sie gültige, positive Zahlen für die Intervalle ein.");
            return;
        }

        executeScript(startAutoScroll, [autoLike, autoSave, baseInterval, randomDelay, likeChance, saveChance]);
    });
    
    elements.stopScrollButton.addEventListener('click', () => executeScript(stopAutoScroll));
    
    elements.resetScrollCountButton.addEventListener('click', () => {
        chrome.storage.local.set({ scrollCount: 0 });
        elements.scrollCounter.textContent = 0;
    });

    // Event-Listener für Slider-Wertanzeige
    elements.likeChanceSlider.addEventListener('input', () => {
        elements.likeChanceValue.textContent = elements.likeChanceSlider.value;
    });
    elements.saveChanceSlider.addEventListener('input', () => {
        elements.saveChanceValue.textContent = elements.saveChanceSlider.value;
    });

    // Nachrichten-Listener für Updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "click-update") elements.clickCounter.textContent = message.count;
        if (message.type === "scroll-update") elements.scrollCounter.textContent = message.count;
    });
});
