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

function createDeleteButton(label, onClick) {
  const button = document.createElement("button");
  button.className = "button button-danger";
  button.type = "button";
  button.textContent = "Delete";
  button.setAttribute("aria-label", `Delete ${label}`);
  button.addEventListener("click", onClick);
  return button;
}

function renderDecks() {
  deckList.replaceChildren();
  setDeckCount(decks.length);
  deckEmpty.hidden = decks.length > 0;

  for (const deck of decks) {
    const item = document.createElement("article");
    item.className = "deck-card";

    const openButton = document.createElement("button");
    openButton.className = "deck-open";
    openButton.type = "button";
    openButton.addEventListener("click", () => openDeck(deck.id));

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

    const deleteButton = createDeleteButton(deck.name, () => {
      decks = decks.filter((item) => item.id !== deck.id);
      saveDecks();
      renderDecks();
    });

    item.append(openButton, deleteButton);
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

  for (const [index, card] of deck.cards.entries()) {
    const item = document.createElement("article");
    item.className = "flashcard";

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

    const deleteButton = createDeleteButton(card.front, () => {
      deck.cards = deck.cards.filter((item) => item.id !== card.id);
      saveDecks();
      renderCards();
    });

    item.append(number, content, deleteButton);
    cardList.append(item);
  }
}

function openDeck(deckId) {
  selectedDeckId = deckId;
  deckView.hidden = true;
  cardsView.hidden = false;
  renderCards();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDecks() {
  selectedDeckId = null;
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

deckNameInput.addEventListener("input", () => deckNameInput.setCustomValidity(""));

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

renderDecks();