// background.js

/**
 * Diese Funktion wird ausgeführt, wenn die Erweiterung zum ersten Mal installiert oder aktualisiert wird.
 * Sie initialisiert die notwendigen Werte im Speicher der Erweiterung.
 * @param {object} details - Enthält Details zum Installationsereignis.
 */
function handleInstalled(details) {
  // Setzt die Zähler für Klicks und Scrolls auf 0.
  // Dies verhindert Fehler, falls das Popup versucht, die Werte zu lesen, bevor sie gesetzt wurden.
  chrome.storage.local.set({
    clickCount: 0,
    scrollCount: 0
  });
  console.log("TikTok Automatisierungs-Erweiterung installiert. Zähler wurden initialisiert.");
}

/**
 * Diese Funktion wird jedes Mal ausgeführt, wenn eine Nachricht von einem anderen Teil der Erweiterung empfangen wird.
 * @param {any} message - Die gesendete Nachricht.
 * @param {object} sender - Informationen über den Absender der Nachricht.
 * @param {function} sendResponse - Eine Funktion, um eine Antwort zu senden.
 * @returns {boolean} - Muss 'true' zurückgeben, um anzuzeigen, dass die Antwort asynchron gesendet wird.
 */
function handleMessage(message, sender, sendResponse) {
  // Protokolliert die empfangene Nachricht zur Fehlersuche.
  console.log("Nachricht im Background-Skript empfangen:", message);
  
  // 'true' zurückgeben, um den Nachrichtenkanal für eine mögliche asynchrone Antwort offen zu halten.
  return true; 
}

// Registriert die Funktionen als Listener für die entsprechenden Ereignisse.
chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.runtime.onMessage.addListener(handleMessage);
