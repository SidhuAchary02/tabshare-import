const EXTENSION_ID = "nhkmmfakleemmcikjahghhodkhoeleok"; 

const hash = location.hash.slice(1);
if (!hash) {
  alert("Invalid link");
  return;
}

let data;
try {
  data = JSON.parse(decodeURIComponent(atob(hash)));
} catch (e) {
  alert("Invalid data");
  return;
}

document.getElementById("open").onclick = () => {
  console.log("Sending message to extension", EXTENSION_ID, { action: 'importTabs', data: data });
  chrome.runtime.sendMessage(EXTENSION_ID, { action: 'importTabs', data: data }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
    } else {
      console.log("Message sent successfully");
    }
  });
};