
import AdvancedSwiper from "/features/swiper.js";
import {renderCalendar,  generateTimeSlots, loadCalendarData} from "/features/calendar.js"
import {collectionsReady} from "/features/collection.js"
import {toggleLoader , showToast} from "./features/utils.js"
// script.js (module)
let bookingData = {};
let calendarData = {};

//=======
let currentEditingId = null;
let editNewDate = null;
let editNewTime = null;
let editCalendarData = {};
let selectedDate = null;
let selectedService = null;
//========

const servicesData = [
  { id: 0, name: "Semi", img: "images/nailss/semi.jpg" },
  { id: 1, name: "Balerina", img: "images/nailss/balerina.jpg" },
  { id: 2, name: "Slim", img: "images/nailss/slim.jpg" },
  { id: 3, name: "Pătrat", img: "images/nailss/patrat.jpg" },
  { id: 4, name: "Pătrat arcuit", img: "images/nailss/patrat-arcuit.jpg" },
  { id: 5, name: "Oval", img: "images/nailss/oval.jpg" },
  { id: 6, name: "Stiletto", img: "images/nailss/stiletto.jpg" }
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

const zaswiper = document.getElementById("swiper_box");
// ------Event listener-----------------


servicesCheckbox.addEventListener("change", e => {
  servicesContainer.classList.toggle("hidden", !e.target.checked); 
 if (e.target.checked) renderServices();
});

initBookingBtn.addEventListener("click", initBooking);
confirmBookingBtn.addEventListener("click", confirmBooking);

modal.addEventListener("click", e => {
  if (e.target.id === "modal"){ modal.classList.remove("active");}        
 
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
      selectedService = s.name;
      document.querySelectorAll(".service").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
    };
    container.appendChild(div);
  });
}

// ---------------------------

loadCalendarData()
// Event listeners
document.getElementById("showCalendarBtn").onclick = async () => {
document.getElementById("calendar-container").classList.remove("hidden");
document.getElementById("colection").classList.add("hidden");
document.getElementById("showCalendarBtn").classList.add("hidden");
await loadCalendarData();
};


//  Init booking
async function initBooking() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const time = document.getElementById("time").value;
const email = document.getElementById("email").value;
  if (!name || !phone || !time ) {
    showToast("Completează toate câmpurile obligatorii!");
    return;

  }

  bookingData = {
    date: document.getElementById("selected-date").textContent,
    time,
    email,
    name,
    phone,
    service: selectedService,
  };

  toggleLoader(true);
  try {
    const res = await fetch("/api/bookings/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData)
   
   });
   console.log(bookingData);

    const data = await res.json();
    toggleLoader(false);

    if (res.ok) {
      showToast(data.message);
      document.getElementById("otp-section").classList.remove("hidden");
      document.getElementById("services-select").classList.add("hidden");
      
    } else {
      showToast(data.message || "Eroare la trimiterea OTP");
    }
  } catch (err) {
    toggleLoader(false);
    console.error(err);
    showToast("Eroare de rețea");
  }

}

// Confirm booking
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
        showToast(data.message);
    
      location.reload(); // refresh calendar and slots
    }
  } catch (err) {
    toggleLoader(false);
    console.error(err);
    showToast("Eroare la confirmarea booking-ului");
  }
}

//===== user update
//========================================
//send
async function sendOtp() {
  const email = document.getElementById("myEmail").value;
  if (!email || !email.includes("@")) {
    showToast("Introdu un email valid!");
    return;
  }
toggleLoader(true);
  const res = await fetch("/api/bookings/my/init", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  showToast(data.message);

  document.getElementById("otpSection").classList.remove("hidden");
  toggleLoader(false);
}
//verify
async function verifyOtp() {
  const email = document.getElementById("myEmail").value;
  const otp = document.getElementById("otpInput").value;

  if (!otp) {
    showToast("Introdu OTP!");
    return;
  }

  toggleLoader(true);

  const res = await fetch("/api/bookings/my/verify", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, otp })
  });

  const data = await res.json();

  toggleLoader(false);

  

  // 
  if (!res.ok) {
    alert(data.message);
    return;
  }

  renderBookings(data); 
}

 //user delete
async function deleteBooking(id) {
  const email = document.getElementById("myEmail").value;

  if (!confirm("Ești sigur?")) return;

  const res = await fetch(`/api/bookings/my/${id}`, {
    method: "DELETE",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  alert(data.message);
 renderBookings(data); 
  verifyOTP(); // reload
}

//render bookings
function renderBookings(bookings) {
  const list = document.getElementById("bookingsList");
  list.innerHTML = "";

  if (!bookings.length) {
    list.innerHTML = "<p>Nu ai programări</p>";
    return;
  }

  bookings.forEach(b => {
    const label = document.createElement("label");
    
    label.innerHTML = ` aveti pe data de ${b.date}<br> la ora: ${b.time}
      <button class="delBtn" data-id="${b._id}">Anuleza</button><br>
      `;
label.querySelector(".delBtn")
  .addEventListener("click", () => deleteBooking(b._id));
    list.appendChild(label);
  });
}

//load from backend
async function loadEditCalendar() {

  const res = await fetch("/api/bookings/calendar");
  editCalendarData = await res.json();

  renderEditCalendar();
}

// ========== add event delete/update


document.getElementById("bookingsList").addEventListener("click", async (e) => {

  const id = e.target.dataset.id;
  const email = document.getElementById("myEmail").value;

  // DELETE
  if (e.target.classList.contains("deleteBtn")) {
    if (!confirm("Ești sigur?")) return;
toggleLoader(true);
    const res = await fetch(`/api/bookings/my/${id}`, {
      method: "DELETE",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    alert(data.message);
toggleLoader(false);
    verifyOtp(); // reload
  }
});
function openMyBookings() {
  document.getElementById("myBookingsModal").classList.remove("hidden");

  // reset fields
  document.getElementById("myEmail").value = "";
  document.getElementById("otpInput").value = "";

  // ascunde secțiuni
  document.getElementById("otpSection").classList.add("hidden");
  document.getElementById("bookingsList").innerHTML = "";
}
document.getElementById("myBookingsModal").addEventListener("click", (e) => {
  if (e.target.id === "myBookingsModal") {
    e.target.classList.add("hidden");
  }
});

function closeBookings(){ document.getElementById("myBookingsModal").classList.add("hidden");};
document.getElementById("closeBtn").addEventListener("click", closeBookings);
document.getElementById("myBookingsBtn").addEventListener("click", openMyBookings);
document.getElementById("sendOtpBtn").addEventListener("click", sendOtp);
document.getElementById("verifyOtpBtn").addEventListener("click", verifyOtp);


//events

document.getElementById("viewCollectionsBtn").addEventListener("click", function(){
document.getElementById("colection").classList.remove("hidden");
document.getElementById("calendar-container").classList.add("hidden");
document.getElementById("showCalendarBtn").classList.remove("hidden");
});
//render colections
(async () => {
  await collectionsReady();
    new AdvancedSwiper(document.getElementById('swiper'), {
    autoDelay: 5000
  });
})();
