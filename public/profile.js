let selectedService = null;
let bookingData = {};
let selectedDate = new Date();
selectedDate.setDate(selectedDate.getDate() + 1); // calendar începe de mâine
let calendarData = {};

// Afișează / ascunde serviciile
document.getElementById("showServices").addEventListener("change", (e) => {
  const div = document.getElementById("services-select");
  div.classList.toggle("hidden", !e.target.checked);

  if (e.target.checked) renderServices();
});

// Servicii
const servicesData = [
  { id: 0, name: "Curățare", img: "images/curatare.jpg" },
  { id: 1, name: "Balerina", img: "images/balerina.jpg" },
  { id: 2, name: "Slim", img: "images/slim.jpg" },
  { id: 3, name: "Pătrat", img: "images/patrat.jpg" },
  { id: 4, name: "Pătrat ascuțit", img: "images/patrat-ascutit.jpg" },
  { id: 5, name: "Oval", img: "images/oval.jpg" },
  { id: 6, name: "Stiletto", img: "images/stiletto.jpg" }
];

// Render servicii
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

// Init booking
async function initBooking() {
  if (selectedService === null) {
    alert("Selectează un serviciu mai întâi!");
    return;
  }

  const phone = document.getElementById("phone").value;
  const time = document.getElementById("time").value;

  bookingData = { service: selectedService, phone, time, date: formatDate(selectedDate) };

  const res = await fetch("/api/bookings/init", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(bookingData)
  });

  const data = await res.json();
  alert(data.message);
  document.getElementById("otp-section").classList.remove("hidden");
}

// Confirm booking
async function confirmBooking() {
  const otp = document.getElementById("otp").value;

  const res = await fetch("/api/bookings/confirm", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({...bookingData, otp})
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) location.reload();
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}
