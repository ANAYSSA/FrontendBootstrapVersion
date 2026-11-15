# 404 Cinema — Final Project

404 Cinema Team · SE-2507
Diyar Umarov · Aibek Mukhat · Anuar Muratbay

## Run locally

Serve this folder with `python3 -m http.server 8000`, then open `http://localhost:8000`.
There is no build step or npm installation. Bootstrap and jQuery have local copies.
The Discover film library needs an internet connection. Use HTTP/HTTPS so localStorage
behaves consistently across pages.

## Pages and features

- Home: movie search, suggestions, highlights, FAQ search, rating and counters.
- Halls: auditorium overview and booking links.
- Schedule: day and hall filters; booking links preselect the movie, time and VIP tier.
- Pricing: consistent movie prices, student discount and VIP options.
- Booking: signed-in contact details, JavaScript validation, calculated total, pending
  state, saved reservation and copyable reference.
- About: project team and cinema information.
- Discover: Studio Ghibli film API, title search, director filter, sorting and details.
- Sign Up / Log In: local account simulation, inline validation and duplicate checks.
- Profile: stored name, email, phone and reservations for the signed-in account.

The day/night theme is saved across pages. Responsive layouts, keyboard controls,
focus styles and reduced-motion support are included.

## JavaScript

`main.js`: theme, clock, navigation, rating and FAQs.
`script.js`: jQuery search, suggestions, progress, counters, lazy images and copy actions.
`schedule.js`: combined programme filters.
`forms.js`: reusable JavaScript validation and accessible inline errors.
`auth.js`: safe storage helpers, accounts, session and profile.
`booking.js`: price calculation and saved demo reservations.
`discover.js`: fetch, loading/error/retry/timeout and safe API rendering.

All forms use `novalidate`. Validation covers the fields each form contains: required
values, email syntax, a 10–15 digit phone number, and passwords of at least 8 characters
with uppercase, lowercase, a digit and a symbol. Signup also checks confirmation and consent.

## Data and API

Browser keys: `cinema-theme`, `cinema-users`, `cinema-session`, `cinema-bookings`.
Accounts and passwords are stored locally only to demonstrate the assignment.
Use invented details and a test password. This is not production authentication.
No payment, email, real seat reservation or real ticket is created. Clearing site
storage removes the demo data. Data is separate on localhost, the preview and team site.

Public community API: https://ghibliapi.vercel.app/films
Documentation: https://ghibliapi.vercel.app/
No API key is required. Catalogue films are separate from the sample cinema programme.
The interface handles loading, request failure, a 12-second timeout and unavailable posters.

## Team division

Diyar: Home, Halls, Discover/API and visual consistency.
Aibek: Schedule, Pricing, filters, responsive checks and testing.
Anuar: Booking, About, accounts/profile, validation and local storage.
All members: integration review, report and presentation rehearsal.

## Hosting

Team repository: https://github.com/d0kus/FrontendBootstrapVersion
Team website: https://d0kus.github.io/FrontendBootstrapVersion/
Final project source branch: https://github.com/ANAYSSA/FrontendBootstrapVersion/tree/final-project
Final project preview: https://anayssa.github.io/FrontendBootstrapVersion/

The preview runs the final-project branch. The team website receives this version
when the final-project pull request is merged into the team repository's main branch.
