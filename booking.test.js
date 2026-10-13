import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  bookingWindow,
  dateKey,
  displayTime,
  isBookable,
  monthCells,
  planText,
  timeKey,
  validPhone,
  validTime,
  whatsappLink,
  whatsappMessage,
  MANAGER_WHATSAPP,
} from "./booking.js";

const samplePlan = {
  service: "Office cleaning",
  size: "De 151 à 250 m²",
  frequency: "Chaque semaine",
  date: "2026-09-23",
  time: "15:00",
  name: "Alex",
  phone: "+229 01 96 00 00 00",
  city: "Cotonou",
  notes: "Priorité aux salles de réunion.",
};

test("booking range excludes today and includes only the next 60 days", () => {
  const today = new Date(2026, 8, 17, 23, 59);
  const { first, last } = bookingWindow(today);
  assert.equal(dateKey(first), "2026-09-18");
  assert.equal(isBookable("2026-09-17", today), false);
  assert.equal(isBookable(dateKey(first), today), true);
  assert.equal(isBookable(dateKey(last), today), true);
  assert.equal(isBookable(dateKey(addDays(last, 1)), today), false);
});

test("month transitions keep the correct local calendar day", () => {
  assert.equal(dateKey(addDays(new Date(2026, 11, 31), 1)), "2027-01-01");
  assert.equal(dateKey(addDays(new Date(2028, 1, 28), 1)), "2028-02-29");
  assert.equal(dateKey(addDays(new Date(2028, 1, 29), 1)), "2028-03-01");
  assert.equal(dateKey(addDays(new Date(2026, 2, 7), 1)), "2026-03-08");
});

test("malformed or normalized impossible dates cannot be booked", () => {
  const today = new Date(2026, 1, 1);
  for (const date of [
    "",
    "2026-2-10",
    "2026-02-30",
    "2026-13-05",
    "<script>",
    "invalid",
  ]) {
    assert.equal(isBookable(date, today), false);
  }
});

test("calendar aligns Monday first, including leap years and six-row months", () => {
  const february = monthCells(2028, 1);
  assert.equal(february[0], null);
  assert.equal(february.filter(Boolean).length, 29);
  assert.equal(dateKey(february.at(-1)), "2028-02-29");
  const august = monthCells(2026, 7);
  assert.equal(august.length, 36);
  assert.equal(
    august.slice(0, 5).every((cell) => cell === null),
    true,
  );
  assert.equal(dateKey(august[5]), "2026-08-01");
});

test("arrival times display morning, noon and afternoon in French", () => {
  assert.equal(displayTime("09:00"), "09 h 00");
  assert.equal(displayTime("12:00"), "12 h 00");
  assert.equal(displayTime("15:00"), "15 h 00");
});

test("download retains preferences and explains the WhatsApp confirmation", () => {
  const text = planText(samplePlan);
  assert.match(text, /^ZOE LABEL — VOTRE RÉCAPITULATIF DE NETTOYAGE/);
  assert.match(text, /Demande transmise à ZOE LABEL via WhatsApp/);
  assert.match(text, /restent à confirmer par ZOE LABEL/);
  assert.match(text, /Service : Entretien de bureaux/);
  assert.match(text, /Surface : De 151 à 250 m²/);
  assert.match(text, /Fréquence souhaitée : Chaque semaine/);
  assert.match(text, /Date souhaitée : mer\. 23 septembre 2026/);
  assert.match(text, /Arrivée souhaitée : 15 h 00 \(heure locale\)/);
  assert.match(text, /Notes : Priorité aux salles de réunion/);
  assert.match(text, /ZOE LABEL vous recontacte pour confirmer le créneau/);
});

test("arrival times stay within service hours on quarter-hour steps", () => {
  for (const time of ["06:00", "09:15", "14:30", "20:45", "21:00"])
    assert.equal(validTime(time), true, time);
  for (const time of ["05:45", "21:15", "22:00", "09:10", "9:00", "", "ab:cd"])
    assert.equal(validTime(time), false, time);
  assert.equal(timeKey(7, 5), "07:05");
  assert.equal(timeKey(0, 0), "00:00");
});

test("phone numbers accept local and international formats only", () => {
  for (const value of [
    "+229 01 96 22 23 18",
    "0196222318",
    "+33 6 12 34 56 78",
    "(01) 96-22-23-18",
  ])
    assert.equal(validPhone(value), true, value);
  for (const value of [
    "",
    "abc",
    "12345",
    "01 96 22 23 18 x",
    "+229 01 96 22 23 18 00 11 22",
  ])
    assert.equal(validPhone(value), false, value);
});

test("WhatsApp message lists every booking detail for the manager", () => {
  const text = whatsappMessage(samplePlan);
  assert.match(text, /^\*ZOE LABEL — Nouvelle demande de réservation\*/);
  assert.match(text, /\*Service :\* Entretien de bureaux/);
  assert.match(text, /\*Date souhaitée :\* mer\. 23 septembre 2026/);
  assert.match(text, /\*Arrivée souhaitée :\* 15 h 00/);
  assert.match(text, /\*Nom :\* Alex/);
  assert.match(text, /\*Téléphone :\* \+229 01 96 00 00 00/);
  assert.match(text, /\*Ville :\* Cotonou/);
  assert.match(text, /\*Notes :\* Priorité aux salles de réunion\./);
  assert.match(
    whatsappMessage({ ...samplePlan, notes: "" }),
    /\*Notes :\* Aucune/,
  );
});

test("WhatsApp link targets the manager's number with the encoded message", () => {
  const url = new URL(whatsappLink(samplePlan));
  assert.equal(url.origin + url.pathname, `https://wa.me/${MANAGER_WHATSAPP}`);
  assert.equal(url.searchParams.get("text"), whatsappMessage(samplePlan));
  assert.match(
    whatsappLink({ ...samplePlan, name: "A&B #1" }, "22900000000"),
    /^https:\/\/wa\.me\/22900000000\?text=.*A%26B%20%231/,
  );
});
