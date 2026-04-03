// script.js (module)
let selectedDate = null;
let selectedService = null;
let bookingData = {};
let calendarData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const servicesData = [
  { id: 0, name: "Curățare", img: "images/curatare.jpg" },
  { id: 1, name: "Balerina", img: "images/balerina.jpg" },
  { id: 2, name: "Slim", img: "images/slim.jpg" },
  { id: 3, name: "Pătrat", img: "images/patrat.jpg" },
  { id: 4, name: "Pătrat arcuit", img: "images/patrat-arcuit.jpg" },
  { id: 5, name: "Oval", img: "images/oval.jpg" },
  { id: 6, name: "Stiletto", img: "images/stiletto.jpg" }
];

// DOM Elements
const calendarDiv = document.getElementById("calendar");
const calendarTitle = document.getElementById("calendar-title");
const showCalendarBtn = document.getElementById("showCalendarBtn");
const modal = document.getElementById("modal");
const servicesCheckbox = document.getElementById("showServices");
const servicesContainer = document.getElementById("services-select");
const initBookingBtn = document.getElementById("initBookingBtn");
const confirmBookingBtn = document.getElementById("confirmBookingBtn");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

// ------Event listener-----------------

servicesCheckbox.addEventListener("change", e => {
  servicesContainer.classList.toggle("hidden", !e.target.checked);
  if (e.target.checked) renderServices();
});

initBookingBtn.addEventListener("click", initBooking);
confirmBookingBtn.addEventListener("click", confirmBooking);

modal.addEventListener("click", e => {
  if (e.target.id === "modal") modal.classList.remove("active");
});

// ---------------------------
// Render services
function renderServices() {
  const container = document.getElementById("services");
  container.innerHTML = "";
  servicesData.forEach(s => {
    const div = document.createElement("div");
    div.className = "service";
    div.innerHTML = `<img src="${s.img}"><p>${s.name}</p>`;
    div.onclick = () => {
      selectedService = s.id;
      document.querySelectorAll(".service").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
    };
    container.appendChild(div);
  });
}

// ---------------------------
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

// Event listeners
document.getElementById("showCalendarBtn").onclick = async () => {
document.getElementById("calendar-container").classList.remove("hidden");
await loadCalendarData();
};
// --month navigation-------
document.getElementById("prevMonth").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
};


function renderCalendar() {
  const calendar = document.getElementById("calendar");
  const title = document.getElementById("monthTitle");

  calendar.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const startDay = (firstDay.getDay() + 6) % 7; // Monday start

  const monthNames = [
    "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
    "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"
  ];

  title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // empty cells
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.appendChild(empty);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const date = dateObj.toISOString().split("T")[0];

    const dayInfo = calendarData[date];
    const freeSlots = dayInfo ? 4 - dayInfo.booked : 4;
    const isSunday = dateObj.getDay() === 0;
    const today = new Date(); 
    today.setHours(0,0,0,0);

    const isPastOrToday = dateObj <= today; 
    const div = document.createElement("div");
    div.className = "day";

    // color logic
    if (isSunday || isPastOrToday) div.classList.add("gray");
    else if (freeSlots === 0) div.classList.add("red");
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
      <small>${isPastOrToday ? "închis" : isSunday ? "închis" : freeSlots + " locuri"}</small>
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
  ["10:00","13:00","15:00","18:00"].forEach(slot => {
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = occupied.includes(slot) ? `${slot} (ocupat)` : slot;
    if (occupied.includes(slot)) option.disabled = true;
    select.appendChild(option);
  });
}

// 6️⃣ Init booking
async function initBooking() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const time = document.getElementById("time").value;

  if (!name || !phone || !time) {
    alert("Completează toate câmpurile obligatorii!");
    return;

  }

  bookingData = {
    date: selectedDate,
    time,
    phone,
    name,
    service: document.getElementById("showServices").checked ? selectedService : null
  };

  toggleLoader(true);
  try {
    const res = await fetch("/api/bookings/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData)
    });

    const data = await res.json();
    toggleLoader(false);

    if (res.ok) {
      showToast("Codul OTP a fost trimis pe telefonul tău!");
      document.getElementById("otp-section").classList.remove("hidden");
    } else {
      showToast(data.message || "Eroare la trimiterea OTP");
    }
  } catch (err) {
    toggleLoader(false);
    console.error(err);
    showToast("Eroare de rețea");
  }

}

// 7️⃣ Confirm booking
async function confirmBooking() {
  const otp = document.getElementById("otp").value;

  if (!otp) {
    alert("Introduceți codul OTP");
    return;
  }

  toggleLoader(true);
  try {
    const res = await fetch("/api/bookings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bookingData, otp })
    });

    const data = await res.json();
    toggleLoader(false);
    showToast(data.message);

    if (res.ok) {
      location.reload(); // refresh calendar and slots
    }
  } catch (err) {
    toggleLoader(false);
    console.error(err);
    showToast("Eroare la confirmarea booking-ului");
  }
}

// Utils
function toggleLoader(show) {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.toggle("hidden", !show);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

window.toggleLoader = toggleLoader = (show) => {
  document.getElementById("loader").classList.toggle("hidden", !show);
};

window.showToast = showToast = (message) => {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
};
