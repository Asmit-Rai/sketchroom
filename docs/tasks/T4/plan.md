# T4 plan: add a clear button next to redo

Steps (what | items | type | test file | command):
1. add a Clear button straight after Redo that empties the board as one undo step via the store's replaceElements, so Undo restores every shape, Redo clears again, and the empty hint and autosave follow | items 1, 2, 3, 4, 6 | unit | tests/clear.test.tsx | npx vitest run tests/clear.test.tsx
2. make Clear on an empty board do nothing and add no undo step | items 5 | unit | tests/clear-empty.test.tsx | npx vitest run tests/clear-empty.test.tsx
