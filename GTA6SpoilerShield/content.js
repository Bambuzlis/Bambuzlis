
(() => {
  if (window.__gta6ShieldLoaded) return;
  window.__gta6ShieldLoaded = true;

  const DEFAULT_KEYWORDS = [
    "gta 6", "gta6", "gta vi",
    "grand theft auto 6", "grand theft auto vi",
    "grand theft auto six", "gta six",
    "grand theft auto",
    "gta 6 ending", "gta 6 spoiler", "gta 6 spoilers",
    "gta 6 leak", "gta 6 leaks", "gta 6 gameplay",
    "gta 6 mission", "gta 6 missions", "gta 6 story",
    "gta 6 characters", "gta 6 trailer", "gta 6 review",
    "gta 6 walkthrough", "gta 6 final mission",
    "gta 6 death", "gta 6 ending explained"
  ];

  const CHARACTER_NAMES = [
    "lucia", "lucia caminos",
    "jason", "jason duval",
    "cal hampton", "brian heder", "boobie ike",
    "dre'quan priest", "dre quan priest",
    "raul bautista", "bae-luxe", "bae luxe",
    "roxy", "lori heder"
  ];

  const CATEGORY_TERMS = {
    deaths: [
      "dies", "die", "death", "dead", "killed", "kills",
      "murder", "murdered", "survives", "survive",
      "survived", "survival", "killed off", "who dies",
      "who survives", "was shot", "gets shot", "shoots",
      "assassinated", "executed"
    ],
    twists: [
      "betrayal", "betrays", "betrayed", "traitor",
      "twist", "plot twist", "revealed", "reveal",
      "turns against", "double-cross", "backstab",
      "switches sides", "secretly working for",
      "was actually", "turns out"
    ],
    endings: [
      "ending", "endings", "finale", "final scene",
      "final mission", "last mission", "secret ending",
      "true ending", "bad ending", "good ending",
      "alternate ending", "post-credit", "post credits",
      "game ending", "story ending"
    ],
    missions: [
      "mission", "missions", "mission outcome",
      "mission walkthrough", "mission ending",
      "mission objective", "boss fight", "heist",
      "robbery", "final objective", "mission fails",
      "mission success"
    ],
    leaks: [
      "leak", "leaks", "leaked", "datamine",
      "datamined", "data mine", "unreleased",
      "script", "source code", "early build",
      "beta footage", "gameplay leak", "leaked footage",
      "stolen build", "internal build"
    ]
  };

  const DEFAULT_CATEGORIES = {
    deaths: true,
    twists: true,
    endings: true,
    missions: true,
    leaks: true
  };

  const SELECTORS = [
    "article",
    "[role='article']",
    "[data-pagelet^='FeedUnit']",
    "[data-ad-preview='message']",
    "[data-testid='tweet']",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-playlist-renderer",
    "yt-lockup-view-model",
    "ytd-watch-next-secondary-results-renderer",
    "[data-testid='post-container']",
    "shreddit-post",
    ".thing",
    ".post",
    ".video-card",
    ".search-result",
    "#search .MjjYud",
    "#search .g",
    "#rso > div"
  ].join(",");

  const CANDIDATE_SELECTORS = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-playlist-renderer",
    "yt-lockup-view-model",
    "[role='article']",
    "[data-pagelet^='FeedUnit']",
    "[data-testid='tweet']",
    "[data-testid='post-container']",
    "shreddit-post",
    "#search .MjjYud",
    "#search .g",
    "#rso > div",
    "article",
    ".thing",
    ".post",
    ".video-card",
    ".search-result"
  ].join(",");

  let enabled = true;
  let customKeywords = [];
  let categories = { ...DEFAULT_CATEGORIES };
  let processed = new WeakSet();

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function matchesPhrase(text, phrase) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(phrase)}(?=$|[^a-z0-9])`,
      "i"
    );
    return pattern.test(text);
  }

  function getKeywords() {
    return [...new Set(
      [...DEFAULT_KEYWORDS, ...customKeywords]
        .map(k => k.trim().toLowerCase())
        .filter(Boolean)
    )];
  }

  function containsSpoiler(text) {
    if (!text) return false;

    const normalized = text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, " ");

    if (getKeywords().some(keyword =>
      matchesPhrase(normalized, keyword)
    )) {
      return true;
    }

    const mentionsCharacter = CHARACTER_NAMES.some(name =>
      matchesPhrase(normalized, name)
    );

    if (mentionsCharacter) {
      const enabledCategoryMatch = Object.entries(CATEGORY_TERMS).some(
        ([category, terms]) => {
          if (!categories[category]) return false;

          return terms.some(term =>
            matchesPhrase(normalized, term)
          );
        }
      );

      if (enabledCategoryMatch) return true;
    }

    const indirectGameReference =
      /\b(vice city|leonida)\b/i.test(normalized);

    const indirectSpoilerLanguage = [
      "gets killed",
      "is killed",
      "ends up dead",
      "turns out to be",
      "secretly betrays",
      "the final choice",
      "the last cutscene"
    ];

    if (indirectGameReference) {
      return Object.entries(CATEGORY_TERMS).some(([category, terms]) => {
        if (!categories[category]) return false;

        return [
          ...terms,
          ...indirectSpoilerLanguage
        ].some(term => matchesPhrase(normalized, term));
      });
    }

    return false;
  }

  function getCandidate(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    return element.closest(CANDIDATE_SELECTORS);
  }

  function getElementText(element) {
    const parts = [
      element.innerText,
      element.getAttribute("aria-label"),
      element.getAttribute("title")
    ];

    element.querySelectorAll(
      "a, h1, h2, h3, [title], [aria-label]"
    ).forEach(child => {
      parts.push(child.innerText);
      parts.push(child.getAttribute("title"));
      parts.push(child.getAttribute("aria-label"));
    });

    return parts.filter(Boolean).join(" ");
  }

  function hideElement(element) {
    if (!element || processed.has(element)) return;

    processed.add(element);

    if (element.dataset.gta6ShieldRevealed === "true") return;

    element.classList.add("gta6-shield-blocked");

    const reveal = document.createElement("button");
    reveal.className = "gta6-shield-reveal";
    reveal.type = "button";
    reveal.textContent = "🛡️ GTA 6 content blocked — Reveal";

    reveal.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      element.classList.remove("gta6-shield-blocked");
      element.classList.add("gta6-shield-revealed");
      element.dataset.gta6ShieldRevealed = "true";

      reveal.remove();
    });

    element.appendChild(reveal);
  }

  function scanElement(element) {
    if (!enabled || !element || element.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (
      element.closest(".gta6-shield-blocked") ||
      element.closest(".gta6-shield-revealed") ||
      element.classList.contains("gta6-shield-reveal")
    ) {
      return;
    }

    const candidate = getCandidate(element);

    if (!candidate || processed.has(candidate)) return;

    if (containsSpoiler(getElementText(candidate))) {
      hideElement(candidate);
    }
  }

  function scanPage() {
    if (!enabled) return;
    document.querySelectorAll(SELECTORS).forEach(scanElement);
  }

  function clearBlockedElements() {
    document.querySelectorAll(".gta6-shield-blocked").forEach(element => {
      element.classList.remove("gta6-shield-blocked");
      element.querySelector(".gta6-shield-reveal")?.remove();
    });
  }

  const observer = new MutationObserver(mutations => {
    if (!enabled) return;

    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        scanElement(mutation.target.parentElement);
        continue;
      }

      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        scanElement(node);
        node.querySelectorAll?.(SELECTORS).forEach(scanElement);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  async function loadSettings() {
    const settings = await chrome.storage.local.get({
      enabled: true,
      customKeywords: [],
      categories: DEFAULT_CATEGORIES
    });

    enabled = settings.enabled;
    customKeywords = settings.customKeywords || [];
    categories = {
      ...DEFAULT_CATEGORIES,
      ...(settings.categories || {})
    };

    if (enabled) {
      processed = new WeakSet();
      scanPage();
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    let needsRescan = false;

    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      if (!enabled) clearBlockedElements();
      needsRescan = true;
    }

    if (changes.customKeywords) {
      customKeywords = changes.customKeywords.newValue || [];
      needsRescan = true;
    }

    if (changes.categories) {
      categories = {
        ...DEFAULT_CATEGORIES,
        ...(changes.categories.newValue || {})
      };
      needsRescan = true;
    }

    if (needsRescan) {
      processed = new WeakSet();

      if (enabled) {
        clearBlockedElements();
        scanPage();
      }
    }
  });

  loadSettings();
})();
