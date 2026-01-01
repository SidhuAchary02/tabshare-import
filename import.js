document.getElementById("import").onclick = async () => {
  const hash = location.hash.slice(1);
  if (!hash) return alert("Invalid link");

  const data = JSON.parse(decodeURIComponent(atob(hash)));

  const tabIds = [];

  for (const tab of data.tabs) {
    const t = await chrome.tabs.create({ url: tab.url, active: false });
    tabIds.push(t.id);
  }

  if (tabIds.length) {
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: data.name,
      color: data.color
    });
  }
};
