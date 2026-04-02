const table = document.getElementById("bookings-table");

async function loadBookings() {
  const res = await fetch("/api/bookings");
  const data = await res.json();

  table.innerHTML = "";

  data.forEach(b => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>${b.serviceName}</td>
      <td>${b.phone}</td>
      <td>
        <button onclick="deleteBooking('${b._id}')">Șterge</button>
      </td>
    `;

    table.appendChild(row);
  });
}

async function deleteBooking(id) {
  await fetch(`/api/bookings/${id}`, { method: "DELETE" });
  loadBookings();
}

loadBookings();
