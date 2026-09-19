import {
  bookingWindow,
  dateKey,
  displayDate,
  displayTime,
  isBookable,
  monthCells,
  planText,
  serviceLabel,
} from "./booking.js";

/**
 * @template {Element} T
 * @param {string} selector
 * @param {{new(): T}} Type
 * @returns {T}
 */
function element(selector, Type) {
  const result = document.querySelector(selector);
  if (!(result instanceof Type))
    throw new Error(`Missing element: ${selector}`);
  return result;
}

const header = element(".site-header", HTMLElement);
const menuToggle = element(".menu-toggle", HTMLButtonElement);
const mobileNav = element("#mobile-nav", HTMLElement);
const dialog = element("#booking-dialog", HTMLDialogElement);
const form = element("#booking-form", HTMLFormElement);
const calendar = element("#calendar-days", HTMLDivElement);
const monthTitle = element("#calendar-month", HTMLElement);
const previousMonth = element("#previous-month", HTMLButtonElement);
const nextMonth = element("#next-month", HTMLButtonElement);
const selectedDateLabel = element("#selected-date", HTMLParagraphElement);
const dateError = element("#date-error", HTMLParagraphElement);
const title = element("#booking-title", HTMLHeadingElement);
const stepPanels = [1, 2, 3].map((step) =>
  element(`#booking-step-${step}`, HTMLDivElement),
);
const progress = [...document.querySelectorAll(".booking-progress li")];
let selectedDate = "";
let visibleMonth = bookingWindow().first;
/** @type {import("./booking.js").CleaningPlan | null} */
let plan = null;

const updateHeader = () =>
  header.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

/** @param {boolean} open */
function setMenu(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute(
    "aria-label",
    open ? "Fermer le menu" : "Ouvrir le menu",
  );
  mobileNav.hidden = !open;
}

menuToggle.addEventListener("click", () => setMenu(mobileNav.hidden));
mobileNav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    setMenu(false);
    menuToggle.focus();
  }
});
window.matchMedia("(min-width: 851px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("pending");
          entry.target.classList.remove("exit-up");
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
          entry.target.classList.add("pending");
          entry.target.classList.toggle(
            "exit-up",
            entry.boundingClientRect.top < 0,
          );
        }
      });
    },
    {
      rootMargin: "-8% 0px -8% 0px",
      threshold: 0.08,
    },
  );
  const revealElements = document.querySelectorAll(".reveal");
  revealElements.forEach((element) => element.classList.add("pending"));
  window.requestAnimationFrame(() => {
    revealElements.forEach((element) => observer.observe(element));
  });
}

/** @param {number} step @param {boolean} [focus] */
function showStep(step, focus = true) {
  stepPanels.forEach((panel, index) => {
    panel.hidden = index !== step - 1;
  });
  form.hidden = step === 3;
  element("#booking-step-2", HTMLDivElement)
    .querySelectorAll("input, textarea")
    .forEach((input) => {
      if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLTextAreaElement
      ) {
        input.disabled = step !== 2;
      }
    });
  progress.forEach((item, index) => {
    item.classList.toggle("active", index < step);
    if (index === step - 1) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  title.textContent = [
    "Préparons votre nettoyage.",
    "Faisons connaissance.",
    "Votre récapitulatif.",
  ][step - 1];
  dialog.scrollTop = 0;
  if (focus) {
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
}

function renderCalendar() {
  const { first, last } = bookingWindow();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthIndex = year * 12 + month;
  previousMonth.disabled =
    monthIndex <= first.getFullYear() * 12 + first.getMonth();
  nextMonth.disabled = monthIndex >= last.getFullYear() * 12 + last.getMonth();
  monthTitle.textContent = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  calendar.replaceChildren();

  for (const date of monthCells(year, month)) {
    if (!date) {
      const space = document.createElement("span");
      space.setAttribute("aria-hidden", "true");
      calendar.append(space);
      continue;
    }
    const key = dateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(date.getDate());
    button.dataset.date = key;
    button.disabled = !isBookable(key);
    button.setAttribute("aria-label", displayDate(key));
    button.setAttribute("aria-pressed", String(key === selectedDate));
    button.addEventListener("click", () => {
      selectedDate = key;
      dateError.hidden = true;
      selectedDateLabel.textContent = displayDate(key);
      calendar.querySelectorAll("button").forEach((day) => {
        day.setAttribute("aria-pressed", String(day.dataset.date === key));
      });
    });
    calendar.append(button);
  }
}

/** @param {number} offset */
function changeMonth(offset) {
  visibleMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + offset,
    1,
    12,
  );
  renderCalendar();
}
previousMonth.addEventListener("click", () => changeMonth(-1));
nextMonth.addEventListener("click", () => changeMonth(1));

/** @param {FormData} data @param {string} name */
function fieldValue(data, name) {
  const value = data.get(name);
  if (typeof value !== "string") throw new Error(`Missing form field: ${name}`);
  return value.trim();
}

function validDate() {
  if (isBookable(selectedDate)) return true;
  selectedDate = "";
  selectedDateLabel.textContent = "Sélectionnez un jour dans le calendrier.";
  visibleMonth = bookingWindow().first;
  showStep(1, false);
  renderCalendar();
  dateError.hidden = false;
  const firstDay = calendar.querySelector("button:not(:disabled)");
  if (firstDay instanceof HTMLButtonElement) firstDay.focus();
  return false;
}

document.querySelectorAll("[data-book]").forEach((button) => {
  button.addEventListener("click", () => {
    form.reset();
    plan = null;
    selectedDate = "";
    selectedDateLabel.textContent = "Sélectionnez un jour dans le calendrier.";
    dateError.hidden = true;
    visibleMonth = bookingWindow().first;
    const service = button.getAttribute("data-book");
    form.querySelectorAll('input[name="service"]').forEach((input) => {
      if (input instanceof HTMLInputElement)
        input.checked = input.value === (service || "Home cleaning");
    });
    renderCalendar();
    showStep(1, false);
    setMenu(false);
    dialog.showModal();
    document.body.classList.add("modal-open");
  });
});

element(".dialog-close", HTMLButtonElement).addEventListener("click", () =>
  dialog.close(),
);
dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  form.reset();
  plan = null;
  element("#booking-summary", HTMLDListElement).replaceChildren();
  element("#booking-mini-summary", HTMLDivElement).textContent = "";
});

element("#next-step", HTMLButtonElement).addEventListener("click", () => {
  if (!validDate()) return;
  const data = new FormData(form);
  element("#booking-mini-summary", HTMLDivElement).textContent =
    `${serviceLabel(fieldValue(data, "service"))} · ${displayDate(selectedDate)} · ${displayTime(fieldValue(data, "time"))} · ${fieldValue(data, "frequency")}`;
  showStep(2);
});
element("#back-step", HTMLButtonElement).addEventListener("click", () =>
  showStep(1),
);
element("#edit-plan", HTMLButtonElement).addEventListener("click", () =>
  showStep(1),
);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (stepPanels[1].hidden) return;
  if (!validDate()) return;
  for (const name of ["name", "address"]) {
    const input = element(`input[name="${name}"]`, HTMLInputElement);
    input.setCustomValidity(
      input.value.trim()
        ? ""
        : name === "name"
          ? "Veuillez saisir votre nom."
          : "Veuillez saisir l’adresse de l’intervention.",
    );
  }
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  plan = {
    service: serviceLabel(fieldValue(data, "service")),
    size: fieldValue(data, "size"),
    frequency: fieldValue(data, "frequency"),
    date: selectedDate,
    time: fieldValue(data, "time"),
    name: fieldValue(data, "name"),
    email: fieldValue(data, "email"),
    address: fieldValue(data, "address"),
    notes: fieldValue(data, "notes"),
  };
  const summary = element("#booking-summary", HTMLDListElement);
  summary.replaceChildren();
  const rows = [
    ["Service", plan.service],
    ["Surface", plan.size],
    ["Fréquence", plan.frequency],
    ["Date", displayDate(plan.date)],
    ["Arrivée", `${displayTime(plan.time)} (heure locale)`],
    ["Nom", plan.name],
    ["E-mail", plan.email],
    ["Adresse", plan.address],
  ];
  if (plan.notes) rows.push(["Notes", plan.notes]);
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    summary.append(term, detail);
  }
  showStep(3);
});

form.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => input.setCustomValidity(""));
});

form.addEventListener("reset", () => {
  form
    .querySelectorAll("input")
    .forEach((input) => input.setCustomValidity(""));
});

element("#download-plan", HTMLButtonElement).addEventListener("click", () => {
  if (!plan) return;
  const url = URL.createObjectURL(
    new Blob([planText(plan)], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `zoe-label-recapitulatif-${plan.date}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
