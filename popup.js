const groupsDiv = document.getElementById("groups");
const historyDiv = document.getElementById("history");
const MAX_HISTORY = 10;

async function loadGroups() {
  const groups = await chrome.tabGroups.query({});

  if (!groups.length) {
    groupsDiv.innerHTML = "<p>No tab groups found</p>";
    return;
  }

  for (const group of groups) {
    const tabs = await chrome.tabs.query({ groupId: group.id });

    const groupEl = document.createElement("div");
    groupEl.className = "group";

    groupEl.innerHTML = `
      <strong>${group.title || "Untitled Group"}</strong>
      <ul>
        ${tabs.map(t => `<li>${t.title}</li>`).join("")}
      </ul>
      <button data-id="${group.id}">Share</button>
    `;

    const shareBtn = groupEl.querySelector("button");
    shareBtn.onclick = (e) => generateShareLink(group, tabs, e.target);

    groupsDiv.appendChild(groupEl);
  }
}

async function loadHistory() {
  const { sharedHistory = [] } = await chrome.storage.local.get("sharedHistory");
  
  if (!sharedHistory.length) {
    historyDiv.innerHTML = "<p class='empty'>No shared groups yet</p>";
    return;
  }

  historyDiv.innerHTML = "";
  
  for (const item of sharedHistory) {
    const historyEl = document.createElement("div");
    historyEl.className = "history-item";

    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    historyEl.innerHTML = `
      <div class="history-info">
        <strong>${item.name || "Untitled Group"}</strong>
        <span class="history-date">${dateStr}</span>
        <span class="history-tabs">${item.tabCount} tab${item.tabCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="history-actions">
        <button class="btn-small" data-url="${item.url}">Copy Link</button>
        <button class="btn-small btn-danger" data-id="${item.id}">Delete</button>
      </div>
    `;

    historyEl.querySelector(".btn-small:not(.btn-danger)").onclick = (e) => {
      const url = e.target.dataset.url;
      navigator.clipboard.writeText(url);
      e.target.textContent = "Copied!";
      setTimeout(() => {
        e.target.textContent = "Copy Link";
      }, 1500);
    };

    historyEl.querySelector(".btn-danger").onclick = async (e) => {
      const id = e.target.dataset.id;
      await deleteHistoryItem(id);
      await loadHistory();
    };

    historyDiv.appendChild(historyEl);
  }
}

async function deleteHistoryItem(id) {
  const { sharedHistory = [] } = await chrome.storage.local.get("sharedHistory");
  const updated = sharedHistory.filter(item => item.id !== id);
  await chrome.storage.local.set({ sharedHistory: updated });
}

async function saveToHistory(group, tabs, shareUrl) {
  const { sharedHistory = [] } = await chrome.storage.local.get("sharedHistory");
  
  // Check for duplicates (same URL means same group)
  const isDuplicate = sharedHistory.some(item => item.url === shareUrl);
  if (isDuplicate) {
    return; // Don't save duplicate
  }
  
  const historyItem = {
    id: Date.now().toString(),
    name: group.title || "Untitled Group",
    color: group.color,
    tabCount: tabs.filter(t => t.url.startsWith("http")).length,
    timestamp: Date.now(),
    url: shareUrl
  };

  // Add to beginning of array and keep only MAX_HISTORY items
  const updated = [historyItem, ...sharedHistory].slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ sharedHistory: updated });
}

async function generateShareLink(group, tabs, buttonElement) {
  const payload = {
    name: group.title,
    color: group.color,
    tabs: tabs
      .filter(t => t.url.startsWith("http"))
      .map(t => ({ title: t.title, url: t.url }))
  };

  const encoded = btoa(
    encodeURIComponent(JSON.stringify(payload))
  );

  const shareUrl = `chrome-extension://${chrome.runtime.id}/import.html#${encoded}`;

  // Copy to clipboard immediately
  await navigator.clipboard.writeText(shareUrl);
  
  // Show feedback
  const originalText = buttonElement.textContent;
  buttonElement.textContent = "Link Copied!";
  buttonElement.classList.add("btn-success");
  
  setTimeout(() => {
    buttonElement.textContent = originalText;
    buttonElement.classList.remove("btn-success");
  }, 2000);

  // Save to history (avoid duplicates)
  await saveToHistory(group, tabs, shareUrl);
  await loadHistory();
}

loadGroups();
loadHistory();
