# ZOE LABEL — Nettoyage de maisons, bureaux, restaurants et vitres

Site responsive en français, réalisé en HTML sémantique, CSS et JavaScript natif.
L’identité reprend le logo fourni de ZOE LABEL : violet profond, touches orange
et fonds clairs. Les visuels illustrent des appartements, bureaux et restaurants
africains contemporains, ainsi que le nettoyage de vitres. La structure épurée
et les animations du site sont conservées.

## Run

Requires Node.js 22.12+ (tested with Node.js 24).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The HTML, CSS, JavaScript, fonts, and photos can also be served directly from any static HTTP server; no framework or runtime API is required.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Features

- Responsive navigation, home/office/restaurant/window-cleaning service cards, a deep-cleaning call to action, process section, and native FAQ accordions.
- Smooth anchor navigation, scroll reveals, image transitions, and reduced-motion support.
- Accessible native booking dialog with service, size, frequency, a calendar for the next 60 days, preferred arrival time, and customer details.
- Local validation, editable summary, and a downloadable text cleaning plan. Customer data is never stored or transmitted and is cleared when the dialog closes.
- Local fonts and images; the page makes no third-party runtime requests.

## Booking integration

**This is a frontend booking preview, not a reservation system.** Times are preferences, not live availability. No request or email is sent, payment taken, or slot reserved. The dialog, FAQ, summary, and downloaded plan explicitly state this.

Before taking real bookings, connect a scheduling backend, validate availability on the server, prevent duplicate reservations, and send confirmed requests to the business. Configure real service areas, pricing, policies, and contact information. Replace the preview copy only when the live integration is ready.

The form submit handler is in `app.js`; pure calendar and plan-formatting helpers are in `booking.js`.

## Assets

`assets/zoe-label-logo.webp` est extrait du PDF fourni par le client et recadré
sans redessiner le logo. Les favicons PNG et ICO reprennent l’emblème violet
recadré du logo original, centré sur fond blanc pour rester lisible en petit format.

### Visuels actuellement affichés

Les variantes `assets/zoe-refined-{team,office,restaurant,windows}-*.webp`
sont des retouches génératives réalisées avec l’IA à partir des visuels
ci-dessous. Elles améliorent la lumière et la netteté, avec des détails
reconstruits : elles ne constituent pas des photos documentaires des
équipes ou clients de ZOE LABEL. Elles sont disponibles en 768 et 1536 pixels.

Le visuel `assets/zoe-refined-home-*.webp` est traité de façon classique
(lumière, contraste, redimensionnement et accentuation légère), sans
retouche générative après refus de l’outil IA. Il conserve le filigrane
présent dans la source et existe en 768 et 1094 pixels. Sa précision reste
limitée par la petite taille de la photo d’origine.

### Sources conservées

Le visuel `assets/cleaning-team.webp` est fourni par le client et utilisé
comme référence pour la section d’accueil.

Les visuels `assets/restaurant-cleaning-*.webp` sont des versions optimisées
de la photo de nettoyage de cuisine fournie par le client, conservées
comme références de la prestation de nettoyage de restaurants.

La photo `assets/office-space.jpg`, fournie par le client, est la référence
de la prestation d’entretien de bureaux et conserve sa résolution d’origine.

La photo `assets/home-cleaning.jpg`, fournie par le client, est la référence
de la prestation « Appartements & maisons » et conserve sa résolution d’origine.

Les images `assets/zoe-apartment-*.webp`, `assets/zoe-office-*.webp`,
`assets/zoe-restaurant-*.webp` et `assets/zoe-windows-*.webp` sont des
illustrations photoréalistes générées par IA pour ce site, inspirées de
contextes urbains contemporains d’Afrique de l’Ouest. Elles ne représentent
pas des locaux, clients ou employés réels de ZOE LABEL. Chaque visuel est
optimisé en WebP et disponible en 768 et 1536 pixels pour les écrans mobiles
et les écrans à haute densité.

Anciennes photos, conservées dans les sources mais non affichées,
provenant d’[Unsplash](https://unsplash.com/license) :

- Living room: https://images.unsplash.com/photo-1600210492486-724fe5c67fb0
- Office: https://images.unsplash.com/photo-1497366754035-f200968a6e72
- Kitchen: https://images.unsplash.com/photo-1556912172-45b7abe8b7e1

DM Sans and Manrope fonts are distributed under the SIL Open Font License. License texts are in `public/` and are included in production builds. Icons are inline SVG.
