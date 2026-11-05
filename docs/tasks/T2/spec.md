# T2 spec: draw the project we are working on

Done means:
1. docs/sketchroom-project.json exists and parseScene reads it as a board (not null); every id is unique and every seed is a whole number of 1 or more, so it draws the same way each import [unit]
2. Import JSON with the file, in the rendered App (jsdom, faking input.files as tests/export.test.tsx does), puts one g[data-type] per element on the board, the empty hint goes away, and 300 ms later sketchroom:scene:v1 holds the same number of elements [unit]
3. The board has a title text "Sketchroom" and one labelled box for each part: Person, App.tsx, Board.tsx, store.ts, persist.ts, localStorage, Agent, Drawing API; a label is a text element whose box lies inside its shape [unit]
4. The two parts not built yet (Agent, Drawing API) have "planned" in their label; no other text says "planned" [unit]
5. Arrows show the flow Person to Board.tsx, Board.tsx to store.ts, store.ts to persist.ts, persist.ts to localStorage, App.tsx to store.ts, Agent to Drawing API, Drawing API to Board.tsx; each arrow's first point is within 20px of its first box and its last point within 20px of its second box [unit]
6. Every element fits inside x 0 to 1200 and y 0 to 600 (the board at 100%, there is no zoom yet), and no two boxes overlap [unit]

Assumed: same reading as T1, which was cancelled after a stalled build step, not after any objection to the drawing: "draw" means a Sketchroom board file the person opens with Import JSON, because agents cannot draw on the board until Part C; "the project" is Sketchroom: the app as built plus the planned agent path, marked planned; the file goes in docs/, not examples/ (Part D runs the server over every file in examples/); black only, as shapes have no colour yet; no browser or manual check, as the unit items pin the layout; no change to app code in src/, no auto-load on start, no new dependency, Part C is not built

SHA-256: 80fa355ed7d3e496e8eeb0651cad6473a2c4cd9dab550a4d059b152e8a913f82
