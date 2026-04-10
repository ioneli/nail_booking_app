// script.js (module)
let selectedDate = null;
let selectedService = null;
let bookingData = {};
let calendarData = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

//=======
let currentEditingId = null;
let editNewDate = null;
let editNewTime = null;
let editCalendarData = {};
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
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const zaswiper = document.getElementById("swiper_box");
// ------Event listener-----------------

servicesCheckbox.addEventListener("change", e => {
  servicesContainer.classList.toggle("hidden", !e.target.checked); 
 if (e.target.checked) renderServices();
});

initBookingBtn.addEventListener("click", initBooking);
confirmBookingBtn.addEventListener("click", confirmBooking);

modal.addEventListener("click", e => {
  if (e.target.id === "modal"){ modal.classList.remove("active");
      zaswiper.classList.toggle("hidden");}        
 
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
        zaswiper.classList.toggle("hidden");        

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
    date: selectedDate,
    time,
    phone,
    name,
    email,
    service: selectedService,
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
window.toggleLoader = toggleLoader = (show) => {
  document.getElementById("loader").classList.toggle("hidden", !show);
};

window.showToast = showToast = (message) => {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
};

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
    alert("Introdu OTP!");
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
    label.classList.add("glitter-purple")
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

// Swiper

class AdvancedSwiper {
  constructor(el, options = {}) {
    this.el = el;
    this.track = el.querySelector('.swiper-track');
    this.slides = Array.from(this.track.children);

    this.pagination = el.querySelector('.pagination');
    this.prevBtn = el.querySelector('.prev');
    this.nextBtn = el.querySelector('.next');

    this.index = 0;
    this.autoDelay = options.autoDelay || 60000;

    this.velocity = 0;
    this.lastX = 0;
    this.lastTime = 0;

    this.init();
  }

  init() {
    this.setupResponsive();
    this.cloneSlides();
    this.createPagination();
    this.bindEvents();
    this.lazyLoad();
    this.startAuto();
    this.goTo(this.index, false);
  }

  setupResponsive() {
    const w = window.innerWidth;
    this.perView = w < 600 ? 1 : w < 900 ? 2 : 3;
    this.slideWidth = this.el.clientWidth / this.perView;

    this.slides.forEach(slide => {
      slide.style.width = this.slideWidth + 'px';
    });
  }

cloneSlides() {
    const clonesBefore = this.slides.slice(-this.perView).map(n => n.cloneNode(true));
    const clonesAfter = this.slides.slice(0, this.perView).map(n => n.cloneNode(true));

    clonesBefore.forEach(n => this.track.insertBefore(n, this.track.firstChild));
    clonesAfter.forEach(n => this.track.appendChild(n));

    this.slides = Array.from(this.track.children);
    this.index = this.perView;
  }

  goTo(i, animate = true) {
    if (animate) {
      this.track.style.transition = 'transform 0.5s ease';
    } else {
      this.track.style.transition = 'none';
    }

    this.track.style.transform = `translateX(-${i * this.slideWidth}px)`;
    this.index = i;
    this.updatePagination();
    this.lazyLoad();
  }

  next() { this.goTo(this.index + 1); }
  prev() { this.goTo(this.index - 1); }

  createPagination() {
    this.dots = [];

    for (let i = 0; i < this.slides.length - 2 * this.perView; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.onclick = () => this.goTo(i + this.perView);
      this.pagination.appendChild(dot);
      this.dots.push(dot);
    }
  }

  updatePagination() {
    const realIndex = (this.index - this.perView + this.dots.length) % this.dots.length;
    this.dots.forEach(d => d.classList.remove('active'));
    if (this.dots[realIndex]) this.dots[realIndex].classList.add('active');
  }

  lazyLoad() {
    this.slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img && !img.src) {
        img.src = img.dataset.src;
      }
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.setupResponsive());

    this.track.addEventListener('transitionend', () => {
      if (this.index <= this.perView - 1) {
        this.goTo(this.slides.length - 2 * this.perView, false);
      }
      if (this.index >= this.slides.length - this.perView) {
        this.goTo(this.perView, false);
      }
    });

    this.nextBtn.onclick = () => this.next();
    this.prevBtn.onclick = () => this.prev();

    // Touch + inertia
    this.el.addEventListener('mousedown', e => this.start(e));
    this.el.addEventListener('touchstart', e => this.start(e));

    window.addEventListener('mousemove', e => this.move(e));
    window.addEventListener('touchmove', e => this.move(e), { passive: false });

    window.addEventListener('mouseup', e => this.end(e));
    window.addEventListener('touchend', e => this.end(e));

    this.el.addEventListener('mouseenter', () => this.stopAuto());
    this.el.addEventListener('mouseleave', () => this.startAuto());
  }
 start(e) {
    this.stopAuto();
    this.dragging = true;

    this.startX = e.touches ? e.touches[0].clientX : e.clientX;
    this.lastX = this.startX;
    this.lastTime = Date.now();

    this.track.style.transition = 'none';
  }

  move(e) {
    if (!this.dragging) return;
    if (e.cancelable) e.preventDefault();

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - this.startX;

    const now = Date.now();
    this.velocity = (x - this.lastX) / (now - this.lastTime);

    this.lastX = x;
    this.lastTime = now;

    this.track.style.transform =
      `translateX(-${this.index * this.slideWidth - dx}px)`;
  }
 end() {
    if (!this.dragging) return;
    this.dragging = false;

    // inertia
    const momentum = this.velocity * 200;

    if (momentum > 50) this.prev();
    else if (momentum < -50) this.next();
    else this.goTo(this.index);

    this.startAuto();
  }

  startAuto() {
    this.stopAuto();
    this.timer = setInterval(() => this.next(), this.autoDelay);
  }

  stopAuto() {
    clearInterval(this.timer);
  }
}
// INIT
new AdvancedSwiper(document.getElementById('swiper'), {
  autoDelay: 5000
});
