# Flashcards

A small flashcard website for creating and studying decks. This project is also an experiment in **fast development with GitHub Copilot**: Copilot was used as a hands-on coding partner to help move from a basic page to a working application through short, iterative requests. The goal was to explore how quickly an idea can become a usable prototype with AI-assisted implementation, while continuing to review and refine the code along the way.

## Features

- Create and delete decks.
- Add, view, search, and delete cards within each deck.
- Search matches case-insensitively against both the front and back of a card.
- Select multiple decks or cards for bulk deletion.
- Study one deck at a time: flip cards, navigate between cards, and shuffle the study order.
- Save decks and cards in browser `localStorage`, so they remain available after a refresh in the same browser.
- Use the responsive layout on desktop and mobile screens.

## Run locally

This project uses Vite.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Start the development server:

   ```sh
   npm run dev
   ```

3. Open the local URL printed by Vite in your browser.

To create a production build, run:

```sh
npm run build
```

To serve that build locally, run:

```sh
npm run preview
```

## Project structure

- `index.html` contains the page views and HTML templates for decks and cards.
- `src/main.js` implements deck/card management, search, selection, persistence, and study interactions.
- `src/style.css` contains the responsive styles and study-card flip animation.

## Technical notes

- **HTML templates:** `index.html` defines `<template>` elements for deck and card items. The render functions clone the appropriate template and populate its text, IDs, and selection state rather than constructing every element from scratch.
- **Event delegation:** The deck and card lists handle selection changes through a listener on each list, and the deck list handles opening or selecting a deck through one delegated click listener. The deck and card toolbars each use a delegated click listener to dispatch their actions from `data-action` attributes. This keeps listener setup independent of how many items are rendered.
- **Browser persistence:** Decks and their cards are serialized as JSON in `localStorage` and restored when the app starts.
- **Safe content rendering:** User-entered deck names and card text are assigned with `textContent`, so they are rendered as text instead of interpreted as HTML.
- **Search and selection:** Search normalizes text to lowercase before matching both card sides. “Select all” in the card view selects the cards matching the active search.
- **Study flow:** The study order is maintained separately from the deck’s saved card order, allowing shuffle to change the practice sequence without rearranging the deck itself.

## Copilot-assisted development

The implementation was developed incrementally with GitHub Copilot assistance. The workflow focused on describing one feature at a time, integrating it into the existing project, then iterating on behavior and simplification. This makes the codebase a practical example of using Copilot to accelerate prototyping and feature development—not a claim that generated code should go unreviewed.

## Current limitations

- Data is stored locally in the browser; there is no account, server, or cross-device sync.
- Clearing the browser's site data removes saved decks and cards.
- This is a learning project and prototype rather than a production flashcard service.