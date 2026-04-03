const table = document.getElementById("bookings-table");
const form = document.getElementById("add-booking-form");

async function loadBookings() {
  const res = await fetch("/api/bookings");
  const data = await res.json();

  data.sort((a,b)=>new Date(a.date+"T"+a.time)-new Date(b.date+"T"+b.time));

  table.innerHTML = "";

  data.forEach(b=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>${b.name}</td>
      <td>${b.phone}</td>
      <td>${b.serviceName||"-"}</td>
      <td><button onclick="del('${b._id}')">X</button></td>
    `;
    table.appendChild(tr);
  });
}

async function del(id){
  await fetch("/api/bookings/"+id,{method:"DELETE"});
  loadBookings();
}

form.onsubmit=async e=>{
  e.preventDefault();

  const data={
    date:form.date.value,
    time:form.time.value,
    name:form.name.value,
    phone:form.phone.value,
    service:form.service.value
  };

  const res=await fetch("/api/bookings",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(data)
  });

  const r=await res.json();
  alert(r.message);
  loadBookings();
};

loadBookings();
