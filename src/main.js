import "./style.css";

const STORAGE_KEY = "flashcards-decks";

const deckView = document.querySelector("#deck-view");
const cardsView = document.querySelector("#cards-view");
const deckForm = document.querySelector("#deck-form");
const cardForm = document.querySelector("#card-form");
const deckList = document.querySelector("#deck-list");
const cardList = document.querySelector("#card-list");
const deckTemplate = document.querySelector("#deck-template");
const cardTemplate = document.querySelector("#card-template");
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
    const item = deckTemplate.content.firstElementChild.cloneNode(true);
    const openButton = item.querySelector(".deck-open");
    const selectionControl = item.querySelector(".selection-checkbox");

    item.querySelector("[data-deck-name]").textContent = deck.name;
    item.querySelector("[data-deck-card-count]").textContent =
      `${deck.cards.length} ${deck.cards.length === 1 ? "card" : "cards"}`;
    openButton.dataset.deckId = deck.id;
    selectionControl.dataset.itemId = deck.id;
    selectionControl.checked = selectedDeckIds.has(deck.id);
    selectionControl.hidden = !deckSelectionMode;
    selectionControl.setAttribute("aria-label", `Select ${deck.name}`);

    if (selectedDeckIds.has(deck.id)) item.classList.add("is-selected");

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
    const item = cardTemplate.content.firstElementChild.cloneNode(true);
    const selectionControl = item.querySelector(".selection-checkbox");

    item.querySelector(".card-number").textContent =
      `CARD ${String(index + 1).padStart(2, "0")}`;
    item.querySelector("[data-card-front]").textContent = card.front;
    item.querySelector("[data-card-back]").textContent = card.back;
    selectionControl.dataset.itemId = card.id;
    selectionControl.checked = selectedCardIds.has(card.id);
    selectionControl.hidden = !cardSelectionMode;
    selectionControl.setAttribute("aria-label", `Select ${card.front}`);

    if (cardSelectionMode) item.classList.add("has-selection");
    if (selectedCardIds.has(card.id)) item.classList.add("is-selected");

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
deckList.addEventListener("click", handleDeckListClick);
cardList.addEventListener("change", handleSelectionChange);

function handleDeckListClick(event) {
  if (!(event.target instanceof Element)) return;
  const openButton = event.target.closest("button.deck-open");
  if (!openButton || !deckList.contains(openButton)) return;

  const deckId = openButton.dataset.deckId;
  if (!deckId) return;
  if (!deckSelectionMode) {
    openDeck(deckId);
    return;
  }

  if (selectedDeckIds.has(deckId)) selectedDeckIds.delete(deckId);
  else selectedDeckIds.add(deckId);
  const checked = selectedDeckIds.has(deckId);
  openButton.closest(".deck-card")?.classList.toggle("is-selected", checked);
  const checkbox = openButton.parentElement?.querySelector(
    ".selection-checkbox",
  );
  if (checkbox instanceof HTMLInputElement) checkbox.checked = checked;
  updateDeckSelectionControls();
}

function handleToolbarAction(event, itemType) {
  if (!(event.target instanceof Element)) return;
  const action = event.target.closest("button[data-action]")?.dataset.action;
  if (!action) return;

  const isDeckToolbar = itemType === "deck";
  const selectedIds = isDeckToolbar ? selectedDeckIds : selectedCardIds;
  const items = isDeckToolbar
    ? decks
    : decks.find((deck) => deck.id === selectedDeckId)?.cards;
  const render = isDeckToolbar ? renderDecks : renderCards;

  if (!items) return;

  switch (action) {
    case "select":
      if (isDeckToolbar) deckSelectionMode = true;
      else cardSelectionMode = true;
      selectedIds.clear();
      render();
      break;
    case "select-all":
      for (const item of items) selectedIds.add(item.id);
      render();
      break;
    case "cancel":
      if (isDeckToolbar) deckSelectionMode = false;
      else cardSelectionMode = false;
      selectedIds.clear();
      render();
      break;
    case "delete":
      if (selectedIds.size === 0) return;
      if (isDeckToolbar) {
        decks = decks.filter((deck) => !selectedIds.has(deck.id));
        deckSelectionMode = false;
      } else {
        const deck = decks.find((item) => item.id === selectedDeckId);
        if (!deck) return;
        deck.cards = deck.cards.filter((card) => !selectedIds.has(card.id));
        cardSelectionMode = false;
      }
      selectedIds.clear();
      saveDecks();
      render();
      break;
  }
}

deckToolbar.addEventListener("click", (event) =>
  handleToolbarAction(event, "deck"),
);
cardToolbar.addEventListener("click", (event) =>
  handleToolbarAction(event, "card"),
);

renderDecks();
