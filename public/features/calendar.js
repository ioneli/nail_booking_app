
let selectedDate = null;
let selectedService = null;
let bookingData = {};
let calendarData = {};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

//========
// Calendar
async function loadCalendarData(year, month) {
  toggleLoader(true);
  try {
    const res = await fetch("/api/bookings/calendar");
    calendarData = await res.json();
  renderCalendar();
  } catch (err) {
    console.error(err);
  } finally {
    toggleLoader(false);
  }
}
//========
let touchStartX = 0;
let touchEndX = 0;

const calendarContainer = document.getElementById("calendar");

// Start touch
calendarContainer.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

// End touch
calendarContainer.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const diff = touchStartX - touchEndX;

  // sensitivity (adjust if needed)
  const threshold = 50;

  if (Math.abs(diff) < threshold) return;

  if (diff > 0) {
    //  swipe left → next month
    goToNextMonth();
  } else {
    //  swipe right → previous month
    goToPrevMonth();
  }
}
// animatin calendar
function animateCalendar(direction, callback) {
  const calendar = document.getElementById("calendar");

  // remove orice animație veche
  calendar.classList.remove(
    "slide-left",
    "slide-right",
    "slide-in-left",
    "slide-in-right"
  );

  // EXIT (iese din ecran)
  calendar.classList.add(
    direction === "next" ? "slide-right" : "slide-left"
  );

  setTimeout(() => {
    callback(); // schimbă luna

    
    // ENTER (intră din partea opusă)
    calendar.classList.add(
      direction === "next" ? "slide-in-right" : "slide-in-left"
    );
    // reset poziție
    calendar.classList.remove("slide-left", "slide-right");

    setTimeout(() => {
    calendar.offsetHeight;
    calendar.classList.add("reset_position");
    // curățare după animație
    setTimeout(() => {
    
    calendar.classList.remove("slide-in-left", "slide-in-right", "reset_position");
    }, 300);
    }, 300);
  }, 300);
}

//========
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  const title = document.getElementById("monthTitle");

  calendar.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const startDay = (firstDay.getDay() + 6) % 7; // Monday start

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];


function generateMonths(currentMonth, currentYear, n) {

  let CalendarHead = "";

  for (let i = -n; i <= n; i++) {

    // Date auto-fixes overflow (e.g., month 12 → Jan next year)
    const date = new Date(currentYear, currentMonth + i);

    const month = date.getMonth();
    const year = date.getFullYear();

    const className = (i === 0)
      ? "strong_visible"
      : "less_visible";

    CalendarHead += `<p class="${className}" data-offset="${i}">${monthNames[month]} <br> ${year}</p>`;
  }

  return CalendarHead;
}



  title.innerHTML =` <div id="monthsH">${generateMonths(currentMonth, currentYear, 2)}</div>;`
  document.getElementById("monthsH").addEventListener("click", (e) => {
  const target = e.target;

  if (!target.classList.contains("less_visible")) return;

  const offset = Number(target.dataset.offset);

  const steps = Math.abs(offset);
  const action = offset > 0 ? goToNextMonth : goToPrevMonth;

  for (let i = 0; i < steps; i++) {
    action();
  }
});


  // empty cells
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.appendChild(empty);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const date = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    const dayInfo = calendarData[date];
    const freeSlots = dayInfo ? 4 - dayInfo.booked : 4;
    const isSunday = dateObj.getDay() === 0;
    const today = new Date(); 
    today.setHours(0,0,0,0);

    const isPastOrToday = dateObj <= today; 
    const div = document.createElement("div");
    div.className = "day";

    // color logic
    if (isSunday || isPastOrToday || freeSlots <= 0) div.classList.add("gray");
    else if (freeSlots ===1) div.classList.add("red");
    else if (freeSlots <= 2) div.classList.add("orange");
    else div.classList.add("green");

    // today highlight
   
    if (
      d === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    ) {
      div.classList.add("today");
    }

    div.innerHTML = `
      <strong>${d}</strong>
      <small>${freeSlots <= 0 ? "închis" :isPastOrToday ? "închis" : isSunday ? "închis" : freeSlots === 1 ? freeSlots + " loc": freeSlots + " locuri"}</small>
    `;

    if (!isSunday && freeSlots > 0 && !isPastOrToday) {
      div.onclick = () => {
        selectedDate = date;
        const occupied = dayInfo ? dayInfo.occupiedHours : [];
        generateTimeSlots(occupied);

        document.getElementById("modal").classList.add("active");
        document.getElementById("selected-date").textContent = date;
      };
    }

    calendar.appendChild(div);
  }
}

// Time slots
function generateTimeSlots(occupied = []) {
  const select = document.getElementById("time");
  select.innerHTML = '<option value="">Selectează ora</option>';
  ["8:00","10:00","17:00","19:00"].forEach(slot => {
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = occupied.includes(slot) ? `${slot} (ocupat)` : slot;
    if (occupied.includes(slot)) option.disabled = true;
    select.appendChild(option);
  });
}

// --month navigation-------
function goToNextMonth() {
  animateCalendar("next", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });
}

function goToPrevMonth() {
  animateCalendar("prev", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });
}

document.getElementById("prevMonth").onclick = goToPrevMonth;
document.getElementById("nextMonth").onclick = goToNextMonth;


export {renderCalendar, generateTimeSlots, loadCalendarData}
