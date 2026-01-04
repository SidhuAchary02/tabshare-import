const groupsDiv = document.getElementById("groups");
const shareBox = document.getElementById("shareBox");
const shareUrlEl = document.getElementById("shareUrl");

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

    groupEl.querySelector("button").onclick = () =>
      generateShareLink(group, tabs);

    groupsDiv.appendChild(groupEl);
  }
}

async function generateShareLink(group, tabs) {
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

  shareUrlEl.value = shareUrl;
  shareBox.classList.remove("hidden");
}

document.getElementById("copy").onclick = () => {
  shareUrlEl.select();
  navigator.clipboard.writeText(shareUrlEl.value);
};

loadGroups();
