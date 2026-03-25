document.addEventListener('DOMContentLoaded', () => {
    const posSelect = document.getElementById('posSelect');
    const runningHubBtn = document.querySelector('.btn-runninghub');

    // Load saved setting
    chrome.storage.local.get(['iconPosition'], (result) => {
        if (result.iconPosition) posSelect.value = result.iconPosition;
    });

    // Save on change
    posSelect.onchange = () => {
        chrome.storage.local.set({ iconPosition: posSelect.value });
    };

    // Ensure links open in new tab
    if (runningHubBtn) {
        runningHubBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: runningHubBtn.href });
        });
    }
});
