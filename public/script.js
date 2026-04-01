const calendarDiv = document.getElementById("calendar");
const bookingForm = document.getElementById("booking-form");
const selectedDateP = document.getElementById("selected-date");
const bookBtn = document.getElementById("book-btn");

let calendarData = {}; // rezervările backend

// Generează toate zilele lunii curente
function getDaysInMonth(year, month) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    const day = date.toISOString().split("T")[0];
    days.push(day);
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Încarcă rezervările de la backend
async function loadCalendar() {
  try {
    const res = await fetch("http://localhost:5000/api/bookings/calendar");
    calendarData = await res.json();
    renderCalendar();
  } catch (err) {
    console.error("Eroare la încărcarea calendarului:", err);
  }
}

// Render calendar complet
function renderCalendar() {
  calendarDiv.innerHTML = "";
  const today = new Date();
  const days = getDaysInMonth(today.getFullYear(), today.getMonth());

  days.forEach((date) => {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");

    const dayOfWeek = new Date(date).getDay();

    // ❌ duminica blocată
    if (dayOfWeek === 0) {
      dayDiv.style.backgroundColor = "#555";
      dayDiv.textContent = `${date} (închis)`;
      dayDiv.style.cursor = "not-allowed";
      calendarDiv.appendChild(dayDiv);
      return;
    }

    const dayInfo = calendarData[date];

    if (dayInfo) {
      dayDiv.classList.add(dayInfo.color);
      dayDiv.textContent = `${date} (${dayInfo.booked}/6)`;

      // ❌ zi full
      if (dayInfo.booked >= 6) {
        dayDiv.style.opacity = "0.5";
        dayDiv.style.cursor = "not-allowed";
      } else {
        dayDiv.addEventListener("click", () => selectDate(date));
      }

    } else {
      dayDiv.classList.add("green");
      dayDiv.textContent = `${date} (0/6)`;
      dayDiv.addEventListener("click", () => selectDate(date));
    }

    calendarDiv.appendChild(dayDiv);
  });
}
// Selectare zi și gestionare ore
function selectDate(date) {
  const dayInfo = calendarData[date];

  // ❌ dacă e full, nu deschidem formularul
  if (dayInfo && dayInfo.booked >= 6) {
    alert("Ziua este complet ocupată!");
    return;
  }

  selectedDateP.textContent = `Data selectată: ${date}`;
  bookingForm.style.display = "block";

  const timeSelect = document.getElementById("time");

  // reset dropdown
  Array.from(timeSelect.options).forEach(opt => opt.disabled = false);

  // dezactivăm orele ocupate
  if (dayInfo && dayInfo.occupiedHours) {
    Array.from(timeSelect.options).forEach(opt => {
      if (dayInfo.occupiedHours.includes(opt.value)) {
        opt.disabled = true;
      }
    });
  }

  bookBtn.onclick = async () => {
    const service = document.getElementById("service").value;
    const phone = document.getElementById("phone").value;
    const time = timeSelect.value;

    if (!phone) {
      alert("Completează numărul de telefon!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, service, time, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Programare confirmată!");
      bookingForm.style.display = "none";
      loadCalendar();
    } catch (err) {
      console.error(err);
      alert("Eroare la rezervare");
    }
  };
}

// Încarcă calendarul la start
loadCalendar();
