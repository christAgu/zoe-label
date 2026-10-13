/** @param {Date} date */
export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** @param {Date} date @param {number} days */
export function addDays(date, days) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    12,
  );
}

/** @param {Date} [today] */
export function bookingWindow(today = new Date()) {
  return { first: addDays(today, 1), last: addDays(today, 60) };
}

/** @param {string} key @param {Date} [today] */
export function isBookable(key, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const parsed = new Date(`${key}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || dateKey(parsed) !== key) return false;
  const { first, last } = bookingWindow(today);
  return key >= dateKey(first) && key <= dateKey(last);
}

/** @param {number} year @param {number} month */
export function monthCells(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: offset + count }, (_, index) =>
    index < offset ? null : new Date(year, month, index - offset + 1, 12),
  );
}

/** @param {string} key */
export function displayDate(key) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${key}T12:00:00`));
}

/** @param {string} time */
export function displayTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${String(hour).padStart(2, "0")} h ${String(minute).padStart(2, "0")}`;
}

const services = new Map([
  ["Home cleaning", "Nettoyage à domicile"],
  ["Office cleaning", "Entretien de bureaux"],
  ["Restaurant cleaning", "Nettoyage de restaurants"],
  ["Window cleaning", "Nettoyage de vitres"],
  ["Deep cleaning", "Grand nettoyage"],
]);

/** @param {string} service */
export function serviceLabel(service) {
  return services.get(service) ?? service;
}

/**
 * @typedef {object} CleaningPlan
 * @property {string} service
 * @property {string} size
 * @property {string} frequency
 * @property {string} date
 * @property {string} time
 * @property {string} name
 * @property {string} phone
 * @property {string} city
 * @property {string} notes
 */

export const SERVICE_HOURS = { first: 6, last: 21 };

/** @param {number} hour @param {number} minute */
export function timeKey(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** @param {string} time */
export function validTime(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hour, minute] = time.split(":").map(Number);
  if (minute % 15 !== 0 || minute > 45) return false;
  if (hour === SERVICE_HOURS.last) return minute === 0;
  return hour >= SERVICE_HOURS.first && hour < SERVICE_HOURS.last;
}

/** @param {string} value */
export function validPhone(value) {
  return /^\+?\d{8,15}$/.test(value.replace(/[\s().-]/g, ""));
}

export const MANAGER_WHATSAPP = "2290196222318";

/** @param {CleaningPlan} plan */
export function planText(plan) {
  return [
    "ZOE LABEL — VOTRE RÉCAPITULATIF DE NETTOYAGE",
    "",
    "Demande transmise à ZOE LABEL via WhatsApp.",
    "Les disponibilités, les tarifs, la zone d’intervention et la récurrence restent à confirmer par ZOE LABEL.",
    "",
    `Service : ${serviceLabel(plan.service)}`,
    `Surface : ${plan.size}`,
    `Fréquence souhaitée : ${plan.frequency}`,
    `Date souhaitée : ${displayDate(plan.date)}`,
    `Arrivée souhaitée : ${displayTime(plan.time)} (heure locale)`,
    `Nom : ${plan.name}`,
    `Téléphone : ${plan.phone}`,
    `Ville : ${plan.city}`,
    `Notes : ${plan.notes || "Aucune"}`,
    "",
    "ZOE LABEL vous recontacte pour confirmer le créneau.",
  ].join("\n");
}

/** @param {CleaningPlan} plan */
export function whatsappMessage(plan) {
  return [
    "*ZOE LABEL — Nouvelle demande de réservation*",
    "",
    `*Service :* ${serviceLabel(plan.service)}`,
    `*Surface :* ${plan.size}`,
    `*Fréquence :* ${plan.frequency}`,
    `*Date souhaitée :* ${displayDate(plan.date)}`,
    `*Arrivée souhaitée :* ${displayTime(plan.time)}`,
    "",
    `*Nom :* ${plan.name}`,
    `*Téléphone :* ${plan.phone}`,
    `*Ville :* ${plan.city}`,
    `*Notes :* ${plan.notes || "Aucune"}`,
    "",
    "Demande envoyée depuis le site ZOE LABEL.",
  ].join("\n");
}

/** @param {CleaningPlan} plan @param {string} [number] */
export function whatsappLink(plan, number = MANAGER_WHATSAPP) {
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage(plan))}`;
}
