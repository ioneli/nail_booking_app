export default class AdvancedSwiper {

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
    this.isDraggingReal = false;
    this.startX = e.touches ? e.touches[0].clientX : e.clientX;
    this.lastX = this.startX;
    this.lastTime = Date.now();

    this.track.style.transition = 'none';
  }

  move(e) {
    if (!this.dragging) return;
    

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - this.startX;
     if (Math.abs(dx) > 5) {
    this.isDraggingReal = true;
     }
    if (this.isDraggingReal && e.cancelable) {
    e.preventDefault();
    }
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
    if (!this.isDraggingReal) {
    this.startAuto();
    return;
    }
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
