import {toggleLoader, showToast} from "/features/utils.js";
export async function collectionsReady(){

function openAlbum(category) {
 toggleLoader(true);
 const album = window.galleryData.find(a => a.category === category);

  if (!album) {
    console.error("Album NOT FOUND:", category);
    return;
  }

  const container = document.getElementById("colection");
 
 container.classList.remove("hidden");
  container.innerHTML = `
    <button id="backBtn">← Back</button>
    <h2>${category}</h2>

    <div class="grid">
      ${(album.images || []).map(img => `<img class="example" src="${img}" />`).join("")}
    

    </div>
  `;
 

 toggleLoader(false);
 
  document.getElementById("backBtn").addEventListener("click", () => {
  toggleLoader(true);
  const container = document.getElementById("colection");
  const swiperTrack = document.querySelector(".swiper-track");
  
 const uniqueSlides = new Set();
 const filteredHTML = Array.from(swiperTrack.children)
 .filter(slide => {
 const html = slide.outerHTML;
 if(uniqueSlides.has(html)) return false;
 uniqueSlides.add(html);
 return true;})
 .map(slide => slide.outerHTML)
 .join("");
  
  container.innerHTML = ` <button onclick="location.reload()">← Back</button><br>`+ filteredHTML; 
  toggleLoader(false);
    document.querySelectorAll(".album").forEach(el => {
    el.addEventListener("click", () => {
      openAlbum(el.dataset.cat);
    });
  });

  });
};


window.openAlbum = openAlbum;

function renderAlbums() {
  const container = document.getElementById("colection");
  const swiperTrack = document.querySelector(".swiper-track");

 const allAlbums =  window.galleryData.map(album => `
    <div class="album slide" data-cat="${album.category}">
      <img src="${album.cover}" />
      <h3>${album.category}</h3>
    </div>
  `).join("");

  swiperTrack.innerHTML = allAlbums;
  
 
  container.innerHTML = ` <button onclick="location.reload()">← Back</button><br>`+ allAlbums; 

  document.querySelectorAll(".album").forEach(el => {
    el.addEventListener("click", () => {
      openAlbum(el.dataset.cat);
    });
  });
 
};

  try {
    const res = await fetch("/api/gallery");
    const albums = await res.json();
    window.galleryData = albums;
    renderAlbums(albums);
  } catch (error) {
    console.error('Error loading gallery:', error);
  }
};

  document.getElementById("colection").addEventListener("click", (e) => {
  if (e.target.classList.contains("example") && !e.target.classList.contains("fullScreen")) {
    e.target.classList.add("fullScreen");
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    const closeImg = document.createElement("button");
    closeImg.textContent = "X";
    closeImg.classList.add("X");
    closeImg.onclick = ()=>{
    e.target.classList.remove("fullScreen");
    closeImg.remove();
    document.documentElement.style.overflow = 'auto';
    }
    
    e.target.parentElement.appendChild(closeImg);
  } 
  
});
