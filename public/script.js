let selectedDate = null;
let selectedService = null;
let bookingData = {};
let calendarData = {};

// Servicii
const servicesData = [
  { id: 0, name: "Curățare", img: "images/curatare.jpg" },
  { id: 1, name: "Balerina", img: "images/balerina.jpg" },
  { id: 2, name: "Slim", img: "images/slim.jpg" },
  { id: 3, name: "Pătrat", img: "images/patrat.jpg" },
  { id: 4, name: "Pătrat arcuit", img: "images/patrat-arcuit.jpg" },
  { id: 5, name: "Oval", img: "images/oval.jpg" },
  { id: 6, name: "Stiletto", img: "images/stiletto.jpg" }
];

// -----------------------
// 1️⃣ Arată calendar la click
document.getElementById("showCalendarBtn").addEventListener("click", async () => {
  document.getElementById("calendar").classList.remove("hidden");
  await loadCalendar();
});

// 2️⃣ Încarcă calendar + sloturi libere
async function loadCalendar() {
  const res = await fetch("/api/bookings/calendar");
  calendarData = await res.json();
  renderCalendar();
}
//convert data
//numele zilei
function getDayName(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('ro-RO', { weekday: 'long' }).format(date);
}
//numele lunii
function getMonthName(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('ro-RO', { month: 'long' }).format(date);
}

// 3️⃣ Render calendar
function renderCalendar() {

    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate()  + 1); // start de mâine
    const date = dateObj.toISOString().split("T")[0]
    const mdiv = document.createElement("div");   
    mdiv.className = "month"
    const cardDiv = document.getElementById("card");
    mdiv.textContent = getMonthName(date);
    cardDiv.insertBefore(mdiv, cardDiv.firstChild);    
    const calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "";

  for (let i = 0; i < 30; i++) {
    
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + i + 1); // start de mâine
    const date = dateObj.toISOString().split("T")[0];
 
    const dayInfo = calendarData[date];
    const freeSlots = dayInfo ? 4 - dayInfo.booked : 4;
    const isSunday = dateObj.getDay() === 0;

    const div = document.createElement("div");
    const theday = date.split('-')[2];
    div.className = "day";
    div.innerHTML = isSunday ? `${theday} <br> <br> ${ getDayName(date)} ` : freeSlots === 0 ? `${theday} <br> Full <br> ${ getDayName(date)} ` : `${freeSlots} locuri ${theday}  <br>  ${ getDayName(date)} `;
    // culoare gradient
    let color = "#00ff00"; // default verde
    if (dayInfo) {
      const ratio = dayInfo.booked / 4;
      const hue = 120 - (120 * ratio);
      color = `hsl(${hue},100%,50%)`;
    }
   
    // click activ doar zile libere & nu duminica
         if (isSunday || freeSlots === 0)  color = "#cccccc";
      div.style.backgroundColor = color;
      div.style.cursor = "not-allowed";
      if (!isSunday && freeSlots > 0) {
      div.style.cursor = "pointer"
       div.onclick = () => {
        const occupied = dayInfo ? dayInfo.occupiedHours : [];
        generateTimeSlots(occupied);
        selectedDate = date;
        document.getElementById("modal").classList.add("active");
        document.getElementById("selected-date").textContent = date

        document.getElementById("services-select").classList.add("hidden");
      };
    }
     
        calendarDiv.appendChild(div);
  }
        document.querySelectorAll(".dinamic").forEach(el => el.remove());
}

// 4️⃣ Checkbox servicii opționale
document.getElementById("showServices").addEventListener("change", (e) => {
  const div = document.getElementById("services-select");
  if (e.target.checked) renderServices();
  div.classList.toggle("hidden", !e.target.checked);
});

// 5️⃣ Render servicii
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
// ----- Orele
function generateTimeSlots(occupied = []) {
  const select = document.getElementById("time");
  select.innerHTML = '<option value="">Selectează ora</option>';

  const slots = ["10:00","13:00","15:00","18:00"];

  slots.forEach(slot => {
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = occupied.includes(slot) ? `${slot} (ocupat)` : slot;

    if (occupied.includes(slot)) {
      option.disabled = true;
    }

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

  const res = await fetch("/api/bookings/init", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(bookingData)
  });

  const data = await res.json();
  alert(data.message);
  document.getElementById("otp-section").classList.remove("hidden");
}

// 7️⃣ Confirm booking
async function confirmBooking() {
  const otp = document.getElementById("otp").value;
  const res = await fetch("/api/bookings/confirm", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({...bookingData, otp})
  });
  const data = await res.json();
  showToast(data.message);
  if (res.ok) location.reload();
}
//toast
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
//loader
//function toggleLoader(show) {
//  document.getElementById("loader").classList.toggle("hidden", !show);
//}

//toggleLoader(true);
// fetch
//toggleLoader(false);
//modal
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");

  modal.addEventListener("click", (e) => {
    if (e.target.id === "modal") {
      modal.classList.remove("active");
    }
  });
});
