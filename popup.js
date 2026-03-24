document.addEventListener('DOMContentLoaded', () => {
    const posSelect = document.getElementById('posSelect');

    // Load saved setting
    chrome.storage.local.get(['iconPosition'], (result) => {
        if (result.iconPosition) posSelect.value = result.iconPosition;
    });

    // Save on change
    posSelect.onchange = () => {
        chrome.storage.local.set({ iconPosition: posSelect.value });
    };
});
