# 404 Cinema - Assignment 6

404 Cinema Team, SE-2507: Diyar Umarov, Aibek Mukhat, Anuar Muratbay.

## Run

Open `index.html`, or serve the folder with `python3 -m http.server 8000` and visit `http://localhost:8000`. No build or npm installation is required. jQuery 4.0.0 is included from its CDN in the head, with a bundled fallback. Bootstrap 5.3.3, images, CSS and scripts are included locally.

## Assignment 6

- Task 0: jQuery setup and the `jQuery is ready!` console message.
- Tasks 1-3: movie search, keyboard-accessible suggestions and safe text highlighting; searchable FAQs.
- Tasks 4-5: gradient scroll progress and counters that animate when visible.
- Tasks 6-7: validated forms with a disabled pending state, spinner and temporary notifications.
- Task 8: copy reservation codes or the ticket support email, with a checkmark and tooltip.
- Task 9: jQuery lazy loading for content images near the viewport.

`js/script.js` contains the jQuery features; `js/main.js` keeps the previous JavaScript features and day/night switch. `js/schedule.js` combines the static weekly programme filters. `css/jquery.css` styles the added components.

## Fixes carried forward from Assignment 5

Day/night mode persists across the six cinema pages. Clock time uses Asia/Almaty. Arrow navigation is scoped to the menu; rating stars support Enter/Space. The VIP dialog manages focus and Escape. Reset restores the booking form defaults. Movie card links preselect the chosen film.

The booking and VIP forms simulate a server delay. They do not send email, charge payments, reserve real seats or create real accounts. The schedule is an explicitly labelled sample weekly programme. Do not enter real passwords.

## Deployment

Updated preview: https://ANAYSSA.github.io/FrontendBootstrapVersion/

Original team repository: https://github.com/d0kus/FrontendBootstrapVersion

After the pull request is merged, GitHub Pages can deploy the team's updated `main` branch at https://d0kus.github.io/FrontendBootstrapVersion/.
