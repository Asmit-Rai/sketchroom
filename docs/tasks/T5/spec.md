# T5 spec: make the whole app look modern: a clean toolbar, rounded buttons, and a dark mode button that remembers my choice

Done means:
1. The page has a button named "Dark mode" at the end of the Undo, Redo, Clear, Export and Import row; one click sets data-theme="dark" on the html element and aria-pressed="true" on the button, a second click sets data-theme="light" and aria-pressed="false" [unit]
2. The choice is saved to localStorage key sketchroom:theme:v1 as "dark" or "light", and a fresh render with "dark" saved starts in dark mode with the button pressed [unit]
3. With nothing saved, or an unknown value saved, the app starts in light mode and nothing crashes [unit]
4. Switching the theme changes no shape, adds no undo step, and leaves sketchroom:scene:v1 as it was [unit]
5. In dark mode the page background is dark and the heading, text and buttons are light and readable, while the drawing board stays white so black shapes stay visible [manual]
6. The toolbar looks clean: the drawing tools sit together in one row and the history and file buttons in another, with even spacing and the same button size [manual]
7. Every button has rounded corners, in light and dark mode, and the pressed tool is easy to tell apart [manual]
8. package.json dependencies and devDependencies are unchanged, and no stylesheet or font is loaded from a remote URL [unit]
9. SPEC.md section 7 no longer lists dark mode as out of scope [unit]
10. Every existing button keeps its name and order, Clear still sits straight after Redo, and npm test, npm run lint and npm run typecheck pass [unit]

Assumed: dark mode as the person answered; the theme is a data-theme attribute on the html element; it starts light and does not follow the system setting; the board surface stays white in dark mode, so shapes and PNG export look the same; styles are plain CSS in a file under src imported from main.tsx, no CSS library; the look items are manual because jsdom cannot judge looks, so no browser test; no new dependency

SHA-256: 0eed6d6c34a481b286428c74496e29893bed66081abdf5b2defca75ad66fa0d7
