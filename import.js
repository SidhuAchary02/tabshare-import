(function() {
  console.log("Import script loaded");
  const hash = location.hash.slice(1);
  console.log("Hash:", hash);
  if (!hash) {
    alert("Invalid link");
    return;
  }

  let data;
  try {
    data = JSON.parse(decodeURIComponent(atob(hash)));
    console.log("Data:", data);
  } catch (e) {
    console.error("Error parsing data:", e);
    alert("Invalid data");
    return;
  }

  document.getElementById("open").onclick = async () => {
    console.log("Button clicked");
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      alert("This page must be opened as a Chrome extension page.");
      return;
    }
    const tabIds = [];
    for (const tab of data.tabs) {
      try {
        const newTab = await chrome.tabs.create({ url: tab.url, active: false });
        tabIds.push(newTab.id);
      } catch (e) {
        console.error("Failed to create tab:", tab.url, e);
      }
    }

    if (tabIds.length > 0) {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, { title: data.name, color: data.color });
    }

    window.close();
  };
})();