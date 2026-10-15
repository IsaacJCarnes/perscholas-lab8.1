import "./style.css";

const STORAGE_KEY = "flashcards-decks";

const deckView = document.querySelector("#deck-view");
const cardsView = document.querySelector("#cards-view");
const deckForm = document.querySelector("#deck-form");
const cardForm = document.querySelector("#card-form");
const deckList = document.querySelector("#deck-list");
const cardList = document.querySelector("#card-list");
const deckEmpty = document.querySelector("#deck-empty");
const cardEmpty = document.querySelector("#card-empty");
const appMessage = document.querySelector("#app-message");
const deckNameInput = document.querySelector("#deck-name");
const cardFrontInput = document.querySelector("#card-front");
const cardBackInput = document.querySelector("#card-back");
const cardsHeading = document.querySelector("#cards-heading");
const deckCount = document.querySelector("#deck-count");
const cardCount = document.querySelector("#card-count");
const backToDecksButton = document.querySelector("#back-to-decks");
const deckSelectToggle = document.querySelector("#deck-select-toggle");
const deckSelectionActions = document.querySelector("#deck-selection-actions");
const deckSelectionCount = document.querySelector("#deck-selection-count");
const deckSelectAll = document.querySelector("#deck-select-all");
const deckDeleteSelected = document.querySelector("#deck-delete-selected");
const deckToolbar = document.querySelector("#deck-view .toolbar");
const cardSelectToggle = document.querySelector("#card-select-toggle");
const cardSelectionActions = document.querySelector("#card-selection-actions");
const cardSelectionCount = document.querySelector("#card-selection-count");
const cardSelectAll = document.querySelector("#card-select-all");
const cardDeleteSelected = document.querySelector("#card-delete-selected");
const cardToolbar = document.querySelector("#cards-view .toolbar");

function loadDecks() {
  const savedDecks = localStorage.getItem(STORAGE_KEY);
  if (!savedDecks) return [];

  const parsedDecks = JSON.parse(savedDecks);
  if (
    !Array.isArray(parsedDecks) ||
    !parsedDecks.every(
      (deck) =>
        typeof deck.id === "string" &&
        typeof deck.name === "string" &&
        Array.isArray(deck.cards) &&
        deck.cards.every(
          (card) =>
            typeof card.id === "string" &&
            typeof card.front === "string" &&
            typeof card.back === "string",
        ),
    )
  ) {
    throw new Error("Saved flashcard data has an invalid format.");
  }

  return parsedDecks;
}

let decks = [];
let selectedDeckId = null;
let deckSelectionMode = false;
let cardSelectionMode = false;
const selectedDeckIds = new Set();
const selectedCardIds = new Set();

try {
  decks = loadDecks();
} catch (error) {
  appMessage.textContent = `Could not load saved decks: ${error.message}`;
}

function saveDecks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    appMessage.textContent = "";
  } catch (error) {
    appMessage.textContent = `Your changes could not be saved: ${error.message}`;
  }
}

function makeId() {
  return crypto.randomUUID();
}

function setDeckCount(count) {
  deckCount.textContent = `${count} ${count === 1 ? "deck" : "decks"}`;
}

function setCardCount(count) {
  cardCount.textContent = `${count} ${count === 1 ? "card" : "cards"}`;
}

function updateSelectionToolbar(
  mode,
  selectedCount,
  totalCount,
  actions,
  toggle,
  count,
) {
  toggle.disabled = totalCount === 0 && !mode;
  toggle.hidden = mode;
  actions.hidden = !mode;
  count.textContent = mode ? `${selectedCount} selected` : "";
}

function updateDeckSelectionControls() {
  updateSelectionToolbar(
    deckSelectionMode,
    selectedDeckIds.size,
    decks.length,
    deckSelectionActions,
    deckSelectToggle,
    deckSelectionCount,
  );
  deckDeleteSelected.disabled = selectedDeckIds.size === 0;
  deckSelectAll.disabled =
    decks.length === 0 || selectedDeckIds.size === decks.length;
}

function updateCardSelectionControls(deck) {
  const totalCards = deck ? deck.cards.length : 0;
  updateSelectionToolbar(
    cardSelectionMode,
    selectedCardIds.size,
    totalCards,
    cardSelectionActions,
    cardSelectToggle,
    cardSelectionCount,
  );
  cardDeleteSelected.disabled = selectedCardIds.size === 0;
  cardSelectAll.disabled =
    totalCards === 0 || selectedCardIds.size === totalCards;
}

function createSelectionControl(label, id, checked, hidden) {
  const control = document.createElement("input");
  control.className = "selection-checkbox";
  control.type = "checkbox";
  control.checked = checked;
  control.hidden = hidden;
  control.dataset.itemId = id;
  control.setAttribute("aria-label", `Select ${label}`);
  return control;
}

function handleSelectionChange(event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const control = event.target;
  if (!control.matches(".selection-checkbox")) return;

  const item = control.closest("article");
  if (!item || !control.dataset.itemId) return;

  if (event.currentTarget === deckList) {
    if (control.checked) selectedDeckIds.add(control.dataset.itemId);
    else selectedDeckIds.delete(control.dataset.itemId);
    item.classList.toggle("is-selected", control.checked);
    updateDeckSelectionControls();
    return;
  }

  if (event.currentTarget === cardList) {
    if (control.checked) selectedCardIds.add(control.dataset.itemId);
    else selectedCardIds.delete(control.dataset.itemId);
    item.classList.toggle("is-selected", control.checked);
    const deck = decks.find((entry) => entry.id === selectedDeckId);
    updateCardSelectionControls(deck);
  }
}

function renderDecks() {
  deckList.replaceChildren();
  setDeckCount(decks.length);
  deckEmpty.hidden = decks.length > 0;
  for (const id of selectedDeckIds) {
    if (!decks.some((deck) => deck.id === id)) selectedDeckIds.delete(id);
  }
  updateDeckSelectionControls();

  for (const deck of decks) {
    const item = document.createElement("article");
    item.className = "deck-card";
    if (selectedDeckIds.has(deck.id)) item.classList.add("is-selected");

    const openButton = document.createElement("button");
    openButton.className = "deck-open";
    openButton.type = "button";
    openButton.addEventListener("click", () => {
      if (deckSelectionMode) {
        if (selectedDeckIds.has(deck.id)) selectedDeckIds.delete(deck.id);
        else selectedDeckIds.add(deck.id);
        const checked = selectedDeckIds.has(deck.id);
        item.classList.toggle("is-selected", checked);
        item.querySelector(".selection-checkbox").checked = checked;
        updateDeckSelectionControls();
        return;
      }
      openDeck(deck.id);
    });

    const icon = document.createElement("span");
    icon.className = "deck-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "▤";

    const details = document.createElement("span");
    details.className = "deck-details";

    const name = document.createElement("strong");
    name.textContent = deck.name;

    const count = document.createElement("span");
    count.textContent = `${deck.cards.length} ${deck.cards.length === 1 ? "card" : "cards"}`;

    const arrow = document.createElement("span");
    arrow.className = "deck-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";

    details.append(name, count);
    openButton.append(icon, details, arrow);

    const selectionControl = createSelectionControl(
      deck.name,
      deck.id,
      selectedDeckIds.has(deck.id),
      !deckSelectionMode,
    );

    item.append(openButton, selectionControl);
    deckList.append(item);
  }
}

function renderCards() {
  const deck = decks.find((item) => item.id === selectedDeckId);
  if (!deck) {
    showDecks();
    return;
  }

  cardsHeading.textContent = deck.name;
  cardList.replaceChildren();
  setCardCount(deck.cards.length);
  cardEmpty.hidden = deck.cards.length > 0;

  for (const id of selectedCardIds) {
    if (!deck.cards.some((card) => card.id === id)) selectedCardIds.delete(id);
  }
  updateCardSelectionControls(deck);

  for (const [index, card] of deck.cards.entries()) {
    const item = document.createElement("article");
    item.className = "flashcard";
    if (cardSelectionMode) item.classList.add("has-selection");
    if (selectedCardIds.has(card.id)) item.classList.add("is-selected");

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = `CARD ${String(index + 1).padStart(2, "0")}`;

    const content = document.createElement("div");
    content.className = "flashcard-content";

    const front = document.createElement("div");
    front.className = "flashcard-side";
    const frontLabel = document.createElement("span");
    frontLabel.className = "side-label";
    frontLabel.textContent = "FRONT";
    const frontText = document.createElement("p");
    frontText.textContent = card.front;
    front.append(frontLabel, frontText);

    const back = document.createElement("div");
    back.className = "flashcard-side flashcard-back";
    const backLabel = document.createElement("span");
    backLabel.className = "side-label";
    backLabel.textContent = "BACK";
    const backText = document.createElement("p");
    backText.textContent = card.back;
    back.append(backLabel, backText);

    content.append(front, back);

    const selectionControl = createSelectionControl(
      card.front,
      card.id,
      selectedCardIds.has(card.id),
      !cardSelectionMode,
    );

    item.append(number, content, selectionControl);
    cardList.append(item);
  }
}

function openDeck(deckId) {
  selectedDeckId = deckId;
  cardSelectionMode = false;
  selectedCardIds.clear();
  deckView.hidden = true;
  cardsView.hidden = false;
  renderCards();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDecks() {
  selectedDeckId = null;
  cardSelectionMode = false;
  selectedCardIds.clear();
  cardsView.hidden = true;
  deckView.hidden = false;
  renderDecks();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

deckForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = deckNameInput.value.trim();
  if (!name) {
    deckNameInput.setCustomValidity("Enter a name for this deck.");
    deckNameInput.reportValidity();
    return;
  }

  deckNameInput.setCustomValidity("");
  decks.push({ id: makeId(), name, cards: [] });
  saveDecks();
  deckForm.reset();
  renderDecks();
  deckNameInput.focus();
});

deckNameInput.addEventListener("input", () =>
  deckNameInput.setCustomValidity(""),
);

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const front = cardFrontInput.value.trim();
  const back = cardBackInput.value.trim();
  if (!front || !back) return;

  const deck = decks.find((item) => item.id === selectedDeckId);
  if (!deck) return;

  deck.cards.push({ id: makeId(), front, back });
  saveDecks();
  cardForm.reset();
  renderCards();
  cardFrontInput.focus();
});

backToDecksButton.addEventListener("click", showDecks);
deckList.addEventListener("change", handleSelectionChange);
cardList.addEventListener("change", handleSelectionChange);

deckToolbar.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const action = event.target.closest("button[data-action]")?.dataset.action;
  if (!action) return;

  switch (action) {
    case "select":
      deckSelectionMode = true;
      selectedDeckIds.clear();
      renderDecks();
      break;
    case "select-all":
      for (const deck of decks) selectedDeckIds.add(deck.id);
      renderDecks();
      break;
    case "cancel":
      deckSelectionMode = false;
      selectedDeckIds.clear();
      renderDecks();
      break;
    case "delete":
      if (selectedDeckIds.size === 0) return;
      decks = decks.filter((deck) => !selectedDeckIds.has(deck.id));
      selectedDeckIds.clear();
      deckSelectionMode = false;
      saveDecks();
      renderDecks();
      break;
  }
});

cardToolbar.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const action = event.target.closest("button[data-action]")?.dataset.action;
  if (!action) return;

  switch (action) {
    case "select":
      cardSelectionMode = true;
      selectedCardIds.clear();
      renderCards();
      break;
    case "select-all": {
      const deck = decks.find((item) => item.id === selectedDeckId);
      if (!deck) return;
      for (const card of deck.cards) selectedCardIds.add(card.id);
      renderCards();
      break;
    }
    case "cancel":
      cardSelectionMode = false;
      selectedCardIds.clear();
      renderCards();
      break;
    case "delete": {
      const deck = decks.find((item) => item.id === selectedDeckId);
      if (!deck || selectedCardIds.size === 0) return;
      deck.cards = deck.cards.filter((card) => !selectedCardIds.has(card.id));
      selectedCardIds.clear();
      cardSelectionMode = false;
      saveDecks();
      renderCards();
      break;
    }
  }
});

renderDecks();
