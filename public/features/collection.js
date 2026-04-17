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
      ${(album.images || []).map(img => `<div class="example"><img src="${img}" /></div>`).join("")}
    

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

let currentFullScreenElement = null;
let startX = 0;
let startY = 0;
let isSwiping = false;

document.getElementById("colection").addEventListener("click", (e) => {
  if (e.target.classList.contains("example") && !e.target.classList.contains("fullScreen")) {
    openFullScreen(e.target);
  }
});

// Touch event listeners for swipe
document.addEventListener("touchstart", (e) => {
  if (currentFullScreenElement) {
    startX = e.touches.clientX;
    startY = e.touches.clientY;
    isSwiping = true;
  }
});

document.addEventListener("touchmove", (e) => {
  if (!isSwiping) return;
  const deltaX = e.touches.clientX - startX;
  const deltaY = e.touches.clientY - startY;
  
  // Only trigger if horizontal swipe is significant (ignore vertical scrolling)
  if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
    e.preventDefault(); // Prevent page scroll
    if (deltaX > 0) {
      // Swipe right → Previous
      navigateTo(currentFullScreenElement, "prev", document.querySelector(".fullscreen-controls"));
    } else {
      // Swipe left → Next
      navigateTo(currentFullScreenElement, "next", document.querySelector(".fullscreen-controls"));
    }
    isSwiping = false;
  }
});

document.addEventListener("touchend", () => {
  isSwiping = false;
});

function openFullScreen(element) {
  currentFullScreenElement = element;
  element.classList.add("fullScreen");
  element.classList.remove("example");
  document.documentElement.style.overflow = 'hidden';
  window.scrollTo(0, 0);

  // Create container for buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("fullscreen-controls");

  // Create close button
  const closeImg = document.createElement("button");
  closeImg.textContent = "X";
  closeImg.classList.add("X");
  closeImg.onclick = () => closeFullScreen(element, buttonContainer);

  // Create previous button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "‹";
  prevBtn.classList.add("nav-btn", "prev-btn");
  prevBtn.onclick = () => navigateTo(element, "prev", buttonContainer);

  // Create next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "›";
  nextBtn.classList.add("nav-btn", "next-btn");
  nextBtn.onclick = () => navigateTo(element, "next", buttonContainer);

  // Check if previous element exists
  const hasPrev = element.previousElementSibling && 
                  element.previousElementSibling.classList.contains("example");
  if (!hasPrev) prevBtn.style.display = "none";

  // Check if next element exists
  const hasNext = element.nextElementSibling && 
                  element.nextElementSibling.classList.contains("example");
  if (!hasNext) nextBtn.style.display = "none";

  buttonContainer.appendChild(prevBtn);
  buttonContainer.appendChild(closeImg);
  buttonContainer.appendChild(nextBtn);
  document.body.appendChild(buttonContainer);
}

function navigateTo(currentElement, direction, buttonContainer) {
  const sibling = direction === "next" 
    ? currentElement.nextElementSibling 
    : currentElement.previousElementSibling;

  if (sibling && sibling.classList.contains("example")) {
    closeFullScreen(currentElement, buttonContainer);
    openFullScreen(sibling);
  }
}

function closeFullScreen(element, buttonContainer) {
  element.classList.remove("fullScreen");
  element.classList.add("example");
  buttonContainer.remove();
  document.documentElement.style.overflow = 'auto';
  currentFullScreenElement = null;
}
