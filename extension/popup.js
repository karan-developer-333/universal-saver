/**
 * Popup logic for "Save to Knowledge"
 */

const API_ENDPOINT = 'http://localhost:3000/api/save';

document.addEventListener('DOMContentLoaded', async () => {
    const pageTitleEl = document.getElementById('page-title');
    const pageUrlEl = document.getElementById('page-url');
    const selectionTextEl = document.getElementById('selection-text');
    const noteInputEl = document.getElementById('note-input');
    const saveBtn = document.getElementById('save-btn');
    const messageEl = document.getElementById('message');
    const statusIndicator = document.getElementById('status-indicator');

    let currentTabData = null;

    // Check server status
    try {
        const response = await fetch('http://localhost:3000/api/items', { method: 'GET' });
        if (response.ok) statusIndicator.classList.add('online');
    } catch (e) {
        statusIndicator.classList.add('offline');
        console.warn('Backend server seems to be offline.');
    }

    // 1. Get active tab and selection
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        pageTitleEl.textContent = tab.title || 'Untitled Page';
        pageUrlEl.textContent = tab.url || 'No URL available';
        currentTabData = {
            url: tab.url,
            title: tab.title
        };

        // Attempt to get selection via content script
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_SELECTION" });
            if (response && response.selectedText) {
                selectionTextEl.value = response.selectedText;
            }
        } catch (err) {
            console.error('Failed to communicate with content script:', err);
            selectionTextEl.placeholder = "Select text on the page first (or reload the page)";
        }
    }

    // 2. Handle Save
    saveBtn.addEventListener('click', async () => {
        const text = selectionTextEl.value.trim();
        const note = noteInputEl.value.trim();

        if (!text) {
            showMessage('Please select or enter some content.', 'error');
            return;
        }

        const dataToSave = {
            ...currentTabData,
            selectedText: text,
            note: note,
            timestamp: new Date().toISOString()
        };

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSave)
            });

            if (response.ok) {
                const result = await response.json();
                showMessage('Saved successfully!', 'success');
                saveBtn.textContent = 'Saved!';

                // Clear inputs after success (optional)
                setTimeout(() => {
                    window.close(); // Close popup after success
                }, 1500);
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            // Even if it fails, the background script might have it queued 
            // if we delegated to it, but for simplicity here we handle it in UI
            showMessage('Error: Backend unreachable. Saving locally...', 'error');

            // Queue locally for background sync
            chrome.storage.local.get({ offlineQueue: [] }, (result) => {
                const queue = result.offlineQueue;
                queue.push(dataToSave);
                chrome.storage.local.set({ offlineQueue: queue });
            });

            saveBtn.textContent = 'Queued Locally';
        }
    });

    function showMessage(msg, type) {
        messageEl.textContent = msg;
        messageEl.className = `message ${type}`;
    }
});
