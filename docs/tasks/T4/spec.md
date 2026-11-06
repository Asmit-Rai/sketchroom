# T4 spec: add a clear button next to redo

Done means:
1. The toolbar has a button named "Clear" placed straight after the Redo button [unit]
2. With shapes on the board, clicking Clear removes every shape: the store holds no elements and the board shows no g[data-type] [unit]
3. After Clear, one Undo (button or Ctrl+Z) brings back every shape exactly as before, same ids, positions and seeds [unit]
4. After Clear then Undo, Redo clears the board again [unit]
5. Clear on an empty board changes nothing and adds no undo step: a following Undo still undoes the change made before it [unit]
6. After Clear the empty-state hint shows, and 300 ms later sketchroom:scene:v1 holds an empty board [unit]

Assumed: Clear is one undo step, done with the existing store history like Import JSON; no "are you sure" prompt, as Undo brings the shapes back; the selected shape's handles go with it; no browser check, as jsdom unit tests cover a button click and the store; no new dependency; built fresh from main, the cancelled T3 branch is not reused

SHA-256: c3f9b86678b70d3367bc8302feaa1019f024a0304a10867cb0c0605d7016d8a8
