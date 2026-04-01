const table = document.getElementById("bookings-table");

async function loadBookings() {
  const res = await fetch("http://localhost:5000/api/bookings");
  const data = await res.json();

  table.innerHTML = "";

  data.forEach(b => {
    const row = document.createElement("tr");

    row.innerHTML = `
     <td>${b.date}</td>
     <td>${b.time}</td>
     <td>${b.service}</td>
     <td>${b.phone}</td>
     <td>
     <button onclick="deleteBooking('${b._id}')" style="background:red;">
      Șterge
    </button>
  </td>
      `;

    table.appendChild(row);
  });
}

async function deleteBooking(id) {
  if (!confirm("Sigur vrei să ștergi?")) return;

  await fetch(`http://localhost:5000/api/bookings/${id}`, {
    method: "DELETE"
  });

  loadBookings();
}

loadBookings();
