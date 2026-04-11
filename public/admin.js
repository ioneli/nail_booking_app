
const table = document.getElementById("bookings-table");
const form = document.getElementById("add-booking-form");


//busy slots

async function loadOccupiedSlots(date) {
  if (!date) return;

  try {
    const res = await fetch(`/api/bookings/by-date/${date}`);
    const bookings = await res.json();

    const occupied = bookings.map(b => b.time);

    const select = form.time; // presupunem că `form.time` este <select> ora
    [...select.options].forEach(opt => {
      if (!opt.value) return; // skip placeholder
      if (occupied.includes(opt.value)) {
        opt.disabled = true;
        opt.textContent = `${opt.value} (ocupat)`;
      } else {
        opt.disabled = false;
        opt.textContent = opt.value;
      }
    });
  } catch (err) {
    console.error("Eroare la încărcarea sloturilor ocupate", err);
  }
}


//load bookings

async function loadBookings() {
  const res = await fetch("/api/bookings");
  const data = await res.json();

  data.sort((a,b)=>new Date(a.date+"T"+a.time)-new Date(b.date+"T"+b.time));

  table.innerHTML = "";

  data.forEach(b=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${b.date}<br>ora:${b.time}</td>
      <td>${b.name}<br>${b.phone || "-"}<br>${b.email || "-"}</td>
      <td>${b.service || "-"}</td>
      <td><button onclick="del('${b._id}')">X</button></td>
    `;
    table.appendChild(tr);
   loadOccupiedSlots(form.date.value) 
 });
}


// delete
async function del(id){
  const res = await fetch("/api/bookings/"+id,{method:"DELETE"});
  loadBookings();
  const r = await res.json();
  if (res.ok) {
  alert(r.message || "Succes!");
  form.reset();
  loadBookings();
  }
   else {
  alert(r.message || "Eroare!");
  }
}

// add
form.onsubmit = async e => {
  e.preventDefault();

  const data = {
    date: form.date.value,
    time: form.time.value,
    name: form.name.value,
    phone: form.phone.value,
    service: form.service.value,
    email: form.email.value
  };

  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const r = await res.json();

  if (res.ok) {
    alert(r.message || "Programare creată cu succes!");
    form.reset();
    loadBookings();
  } else {
    alert(r.message || "Ora selectată este deja ocupată!");
  }
};


form.date.addEventListener("change", () => {
  loadOccupiedSlots(form.date.value);
});

loadOccupiedSlots(form.date.value);

loadBookings();
