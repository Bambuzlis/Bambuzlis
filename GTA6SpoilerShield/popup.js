
const toggle = document.getElementById("toggle");
const status = document.getElementById("status");
const statusText = document.getElementById("statusText");
const keywordInput = document.getElementById("keywordInput");
const addButton = document.getElementById("add");
const keywordList = document.getElementById("keywords");

const categoryIds = [
  "deaths",
  "twists",
  "endings",
  "missions",
  "leaks"
];

const defaultCategories = {
  deaths: true,
  twists: true,
  endings: true,
  missions: true,
  leaks: true
};

let settings = {
  enabled: true,
  customKeywords: [],
  categories: { ...defaultCategories }
};

async function loadSettings() {
  const saved = await chrome.storage.local.get({
    enabled: true,
    customKeywords: [],
    categories: defaultCategories
  });

  settings = {
    ...saved,
    categories: {
      ...defaultCategories,
      ...(saved.categories || {})
    }
  };

  render();
}

function render() {
  statusText.textContent = settings.enabled
    ? "Protection is ON"
    : "Protection is OFF";

  status.classList.toggle("off", !settings.enabled);

  toggle.textContent = settings.enabled
    ? "Disable protection"
    : "Enable protection";

  categoryIds.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = settings.categories[id];
    }
  });

  keywordList.replaceChildren();

  settings.customKeywords.forEach((keyword, index) => {
    const row = document.createElement("div");
    row.className = "keyword";

    const label = document.createElement("span");
    label.textContent = keyword;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "✕";

    remove.addEventListener("click", async () => {
      settings.customKeywords.splice(index, 1);
      await saveSettings();
    });

    row.append(label, remove);
    keywordList.appendChild(row);
  });
}

async function saveSettings() {
  await chrome.storage.local.set(settings);
  render();
}

toggle.addEventListener("click", async () => {
  settings.enabled = !settings.enabled;
  await saveSettings();
});

categoryIds.forEach(id => {
  const checkbox = document.getElementById(id);

  checkbox.addEventListener("change", async () => {
    settings.categories[id] = checkbox.checked;
    await saveSettings();
  });
});

async function addKeyword() {
  const keyword = keywordInput.value.trim();

  if (!keyword) return;

  if (settings.customKeywords.some(
    item => item.toLowerCase() === keyword.toLowerCase()
  )) {
    keywordInput.value = "";
    return;
  }

  settings.customKeywords.push(keyword);

  keywordInput.value = "";
  await saveSettings();
}

addButton.addEventListener("click", addKeyword);

keywordInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addKeyword();
  }
});

loadSettings();
