browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url === "about:home") {
        browser.tabs.update(tabId, {
            url: browser.runtime.getURL("new-tab.html")
        });
    }
});