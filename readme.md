# Reaction Time Lab: Harry Potter Edition

A Harry Potter themed reaction time game built with HTML, CSS, JavaScript and a small Python server.

## How it works

1. The participant registers with name and Student ID.
2. A target character is shown, for example **Harry Potter**.
3. Five red lights turn on one by one.
4. When the lights go off, images of Harry, Hermione and Ron flash in random order.
5. The player must click **only when the target character appears**.
6. Reaction time is measured in milliseconds.

### Rules

- Clicking during the lights is a **false start** (the attempt does not count, retry).
- Clicking the **wrong character** fails the participant.
- Missing the target (it passes without a click) also fails the participant.
- On failure, the next participant screen appears automatically after 3 seconds.
- 3 correct attempts complete the run, and the best time is saved.

### Difficulty levels

| Level  | Image speed | Light interval |
|--------|-------------|----------------|
| Easy   | 1300 ms     | 650 ms         |
| Medium | 1000 ms     | 450 ms         |
| Hard   | 750 ms      | 300 ms         |

## Tech stack

- Frontend: HTML5, CSS3, vanilla JavaScript
- Backend: Python 3 (`http.server`, no external packages)
- Storage: CSV file (`results.csv`)

## Project structure

```
index.html   - UI (registration + game screens)
style.css    - Harry Potter theme (gold + maroon)
script.js    - Game logic
server.py    - Static server + /save endpoint + /view leaderboard
images/      - Character images (add your own)
```

## Setup

1. Clone the repo:
```
   git clone https://github.com/<your-username>/reaction-time-lab-harry-potter.git
   cd reaction-time-lab-harry-potter
```
2. Add three images in the `images/` folder with these exact names:
   - `harry.jpg`
   - `hermione.jpg`
   - `ron.jpg`
3. Start the server:
```
   python server.py
```
   (use `python3 server.py` if needed)
4. Open the game: http://localhost:8000
5. Live leaderboard: http://localhost:8000/view

> Do not open `index.html` directly by double-click. Saving results needs the Python server running.

## Data

Results are saved to `results.csv` with these columns:
`Time, Name, StudentID, Difficulty, Attempt1, Attempt2, Attempt3, BestMs`

This file is git-ignored to protect participant data.

## Disclaimer

Harry Potter characters and images belong to their respective owners (J.K. Rowling / Warner Bros.). This is a non-commercial educational project. Images are not included in this repository.

## Author

Jatin kumar, 25k-0793