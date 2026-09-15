# typordle

A Wordle clone where the daily answer is a typo you actually made, not a dictionary word.

## Files

- `index.html` — page structure
- `style.css` — all styling
- `script.js` — game logic
- `words.js` — **your typo list, edit this whenever you catch a new one**

No build step, no dependencies. It's just static files.

## Adding a typo

Open `words.js` and add a line:

```js
{ typo: "recieve", correct: "receive" },
```

`typo` is what the player has to guess. `correct` is shown after the round as a "you meant to type ___" caption. The game works through the list in order, one per day, and loops back to the start when it runs out — so you can keep it short at first.

## Try it locally

Just open `index.html` in a browser. (Some browsers restrict local file access for scripts — if the page loads but nothing shows up, run a tiny local server instead: `python3 -m http.server` in this folder, then visit `http://localhost:8000`.)

## Deploy on GitHub Pages

1. Create a new repo on GitHub (e.g. `typordle`).
2. Push these files to it:
   ```bash
   git init
   git add .
   git commit -m "typordle"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/typordle.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a URL like `https://YOUR_USERNAME.github.io/typordle/` within a minute or two.

To publish a new typo, just edit `words.js`, commit, and push — the site rebuilds automatically since it's static.

## Notes

- The "daily" word is computed from the date in the visitor's browser, so it's the same for you all day without needing a server.
- Progress and win/streak stats are stored in `localStorage`, per browser/device — there's no account system or shared leaderboard.
- Word length adapts to each day's typo, so the grid isn't fixed at 5 letters.
