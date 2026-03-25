document.addEventListener('DOMContentLoaded', () => {
    const posSelect = document.getElementById('posSelect');
    const speedSelect = document.getElementById('speedSelect');
    const runningHubBtn = document.querySelector('.btn-runninghub');

    // Load saved settings
    chrome.storage.local.get(['iconPosition', 'playbackSpeed'], (result) => {
        if (result.iconPosition) posSelect.value = result.iconPosition;
        if (result.playbackSpeed) speedSelect.value = result.playbackSpeed;
    });

    // Save on change
    posSelect.onchange = () => {
        chrome.storage.local.set({ iconPosition: posSelect.value });
    };

    speedSelect.onchange = () => {
        chrome.storage.local.set({ playbackSpeed: speedSelect.value });
    };

    // Ensure links open in new tab
    if (runningHubBtn) {
        runningHubBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: runningHubBtn.href });
        });
    }
});
