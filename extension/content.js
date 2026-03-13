/**
 * Content script to handle DOM interaction and selection capture.
 */

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_SELECTION") {
        const selection = window.getSelection().toString().trim();
        const title = document.title;
        const url = window.location.href;

        sendResponse({
            selectedText: selection,
            title: title,
            url: url
        });
    }
    return true; // Keep the message channel open for async responses
});
