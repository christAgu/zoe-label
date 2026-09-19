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
} from "./booking.js";

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

test("download retains preferences and explicitly avoids claiming a reservation", () => {
  const text = planText({
    service: "Office cleaning",
    size: "De 151 à 250 m²",
    frequency: "Chaque semaine",
    date: "2026-09-23",
    time: "15:00",
    name: "Alex",
    email: "alex@example.com",
    address: "123 Test Street",
    notes: "Priorité aux salles de réunion.",
  });
  assert.match(text, /^ZOE LABEL — VOTRE RÉCAPITULATIF DE NETTOYAGE/);
  assert.match(text, /DÉMONSTRATION — ceci n’est pas une réservation confirmée/);
  assert.match(
    text,
    /Aucune demande envoyée, aucun créneau réservé et aucun paiement effectué/,
  );
  assert.match(text, /Service : Entretien de bureaux/);
  assert.match(text, /Surface : De 151 à 250 m²/);
  assert.match(text, /Fréquence souhaitée : Chaque semaine/);
  assert.match(text, /Date souhaitée : mer\. 23 septembre 2026/);
  assert.match(text, /Arrivée souhaitée : 15 h 00 \(heure locale\)/);
  assert.match(text, /Notes : Priorité aux salles de réunion/);
  assert.match(text, /Il n’a pas été envoyé à ZOE LABEL/);
});
