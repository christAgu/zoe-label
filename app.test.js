import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

let dom;
let document;
let revealObserver;

before(async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  dom = new JSDOM(html, { url: "http://localhost", pretendToBeVisual: true });
  const { window } = dom;
  document = window.document;
  window.matchMedia = () => ({ matches: false, addEventListener() {} });
  class TestIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.elements = new Set();
      revealObserver = this;
    }

    observe(element) {
      this.elements.add(element);
    }
  }
  window.IntersectionObserver = TestIntersectionObserver;
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new window.Event("close"));
  };
  Object.assign(globalThis, {
    window,
    document,
    HTMLElement: window.HTMLElement,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLDialogElement: window.HTMLDialogElement,
    HTMLFormElement: window.HTMLFormElement,
    HTMLDivElement: window.HTMLDivElement,
    HTMLParagraphElement: window.HTMLParagraphElement,
    HTMLHeadingElement: window.HTMLHeadingElement,
    HTMLDListElement: window.HTMLDListElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    FormData: window.FormData,
    IntersectionObserver: TestIntersectionObserver,
  });
  await import("./app.js");
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
});

after(() => {
  delete globalThis.IntersectionObserver;
  dom.window.close();
});

test("scroll reveals replay when an element enters and leaves the viewport", () => {
  const target = document.querySelector(".service-card.reveal");
  assert.ok(revealObserver.elements.has(target));
  assert.equal(target.classList.contains("pending"), true);
  assert.deepEqual(revealObserver.options, {
    rootMargin: "-8% 0px -8% 0px",
    threshold: 0.08,
  });

  revealObserver.callback([
    { target, isIntersecting: true, boundingClientRect: { top: 200 } },
  ]);
  assert.equal(target.classList.contains("visible"), true);
  assert.equal(target.classList.contains("pending"), false);

  revealObserver.callback([
    { target, isIntersecting: false, boundingClientRect: { top: -200 } },
  ]);
  assert.equal(target.classList.contains("pending"), true);
  assert.equal(target.classList.contains("exit-up"), true);

  revealObserver.callback([
    { target, isIntersecting: true, boundingClientRect: { top: 100 } },
  ]);
  assert.equal(target.classList.contains("visible"), true);
  assert.equal(target.classList.contains("exit-up"), false);
});

test("a service CTA preselects its service and date is required before continuing", () => {
  document.querySelector('[data-book="Office cleaning"]').click();
  assert.equal(document.querySelector("#booking-dialog").open, true);
  assert.equal(
    document.querySelector('input[name="service"]:checked').value,
    "Office cleaning",
  );
  document.querySelector("#next-step").click();
  assert.equal(document.querySelector("#date-error").hidden, false);
  assert.equal(document.querySelector("#booking-step-2").hidden, true);
  document.querySelector(".calendar-day:not(:disabled)").click();
  document.querySelector("#next-step").click();
  assert.equal(document.querySelector("#booking-step-2").hidden, false);
  assert.match(
    document.querySelector("#booking-mini-summary").textContent,
    /Entretien de bureaux/,
  );
});

test("required contact details and email validity block incomplete plans", () => {
  const form = document.querySelector("#booking-form");
  form.requestSubmit();
  assert.equal(document.querySelector("#booking-step-3").hidden, true);
  document.querySelector('[name="name"]').value = "Alex Test";
  document.querySelector('[name="email"]').value = "not-an-email";
  document.querySelector('[name="address"]').value = "123 Test Street";
  assert.equal(form.checkValidity(), false);
  form.requestSubmit();
  assert.equal(document.querySelector("#booking-step-3").hidden, true);
});

test("a valid plan renders user text safely and can be edited without losing details", () => {
  const form = document.querySelector("#booking-form");
  document.querySelector('[name="email"]').value = "alex@example.com";
  document.querySelector('[name="notes"]').value =
    '<img src="x" onerror="alert(1)">';
  form.requestSubmit();
  const summary = document.querySelector("#booking-summary");
  assert.equal(document.querySelector("#booking-step-3").hidden, false);
  assert.match(summary.textContent, /Alex Test/);
  assert.match(summary.textContent, /<img src="x"/);
  assert.equal(summary.querySelector("img"), null);
  document.querySelector("#edit-plan").click();
  assert.equal(document.querySelector("#booking-step-1").hidden, false);
  document.querySelector("#next-step").click();
  assert.equal(
    document.querySelector('[name="email"]').value,
    "alex@example.com",
  );
});

test("closing the dialog clears personal details and custom validation errors", () => {
  const name = document.querySelector('[name="name"]');
  name.setCustomValidity("Please enter your name.");
  document.querySelector(".dialog-close").click();
  assert.equal(document.querySelector("#booking-dialog").open, false);
  assert.equal(document.body.classList.contains("modal-open"), false);
  assert.equal(name.value, "");
  assert.equal(name.validity.customError, false);
  assert.equal(document.querySelector("#booking-summary").textContent, "");
  assert.equal(document.querySelector('[name="notes"]').value, "");
  document.querySelector('[data-book="Deep cleaning"]').click();
  assert.equal(
    document.querySelector('input[name="service"]:checked').value,
    "Deep cleaning",
  );
  assert.equal(document.querySelector("#date-error").hidden, true);
  document.querySelector(".dialog-close").click();
});

test("mobile navigation updates its accessible state and closes on navigation", () => {
  const toggle = document.querySelector(".menu-toggle");
  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(document.querySelector("#mobile-nav").hidden, false);
  document.querySelector("#mobile-nav a").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(document.querySelector("#mobile-nav").hidden, true);
});

for (const [service, label] of [
  ["Restaurant cleaning", "Nettoyage de restaurants"],
  ["Window cleaning", "Nettoyage de vitres"],
]) {
  test(`${service} keeps the selected service through the booking summary`, () => {
    document.querySelector(`[data-book="${service}"]`).click();
    assert.equal(
      document.querySelector('input[name="service"]:checked').value,
      service,
    );
    document.querySelector(".calendar-day:not(:disabled)").click();
    document.querySelector("#next-step").click();
    assert.ok(
      document.querySelector("#booking-mini-summary").textContent.includes(label),
    );
    document.querySelector('[name="name"]').value = "Camille Test";
    document.querySelector('[name="email"]').value = "camille@example.com";
    document.querySelector('[name="address"]').value = "1 rue Exemple";
    document.querySelector("#booking-form").requestSubmit();
    assert.equal(document.querySelector("#booking-step-3").hidden, false);
    assert.equal(
      document.querySelector("#booking-summary dd").textContent,
      label,
    );
    document.querySelector(".dialog-close").click();
  });
}
