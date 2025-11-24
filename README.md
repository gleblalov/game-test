# game-test

## How to run:
1. npm install
2. ng serve
3. http://localhost:4200

## Usage
1. Open the Settings Modal.
2. Adjust the game parameters:
- Falling Speed: 1–5
- Falling Frequency: 100–3000 ms
- Player Speed: 1–10
- Game Time: minimum 5 seconds
3. Click “New Game” to start.
4. Move the player using ArrowLeft and ArrowRight keys to catch falling objects.
5. Watch your score update and the timer countdown.
6. Game ends automatically when time runs out or can be restarted via the settings modal.

## Notes
- Game state is updated reactively via signals and RxJS streams.
- Collision detection is optimized to avoid unnecessary array filtering on every tick.
- Keyboard input uses a reactive pressed keys set to handle multiple keys simultaneously.
- The game is modular, following SOLID principles, with each service responsible for its own domain logic.
