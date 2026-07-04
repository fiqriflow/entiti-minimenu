/* ========================================================================
   ENTITI BADMINTON COMMUNITY — script.js
   ========================================================================
   DAFTAR ISI:
   1. SPLASH SCREEN
   2. EVENT SLIDER (data + build otomatis + drag/swipe + tombol panah)
   3. LIGHTBOX (buka foto + download)
   4. ANIMASI ENTRANCE PER SECTION
   5. GOOGLE ANALYTICS 4 — helper trackCTAClick()
   ======================================================================== */

/* ------------------------------------------------------------------------
   1. SPLASH SCREEN — sembunyikan otomatis setelah beberapa saat
   ------------------------------------------------------------------------ */
window.addEventListener('load', function () {
  var splash = document.getElementById('splashScreen');
  var SPLASH_DURATION_MS = 1600; // ganti angka ini untuk atur lama splash screen tampil
  setTimeout(function () {
    splash.classList.add('splash-hide');
    splash.addEventListener('transitionend', function () {
      splash.style.display = 'none';
    }, { once: true });
  }, SPLASH_DURATION_MS);
});

/* ------------------------------------------------------------------------
   2. EVENT SLIDER
   --------------------------------------------------------------------
   GANTI FOTO EVENT DI SINI: tambah / hapus / ganti object di array
   EVENT_SLIDES di bawah ini. Setiap object butuh:
     - src          : path ke file foto di folder assets/ (atau URL)
     - alt          : teks alternatif untuk aksesibilitas & SEO
     - downloadName : nama file saat di-download dari lightbox

   Contoh nambah foto baru:
     1. Taruh file fotonya di folder assets/, misal assets/event-4.jpg
     2. Tambahkan object baru di array EVENT_SLIDES:
        { src: "assets/event-4.jpg", alt: "Turnamen internal Mei 2026",
          downloadName: "entiti-event-4.jpg" }
   Slide & titik indikator (dots) otomatis bertambah, tidak perlu edit
   index.html sama sekali.
   ------------------------------------------------------------------------ */
var EVENT_SLIDES = [
  {
    src: "assets/event-1.jpg",
    alt: "Sesi latihan bersama Entiti Badminton Community",
    downloadName: "entiti-event-1.jpg"
  },
  {
    // Placeholder — ganti "src" dengan path foto event asli, mis. "assets/event-2.jpg"
    src: "assets/event-2.jpg",
    alt: "Placeholder slide event kedua",
    downloadName: "entiti-event-2.jpg"
  }
];

var sliderTrack = document.getElementById('sliderTrack');
var sliderDots = document.getElementById('sliderDots');

// Bangun slide & dots secara otomatis dari EVENT_SLIDES
EVENT_SLIDES.forEach(function (slideData, index) {
  var slideEl = document.createElement('div');
  slideEl.className = 'slide';

  var imgEl = document.createElement('img');
  imgEl.src = slideData.src;
  imgEl.alt = slideData.alt;
  imgEl.loading = 'lazy';
  // CATATAN: kita SENGAJA tidak pakai addEventListener('click', ...) di sini.
  // Alasannya: sliderTrack.setPointerCapture() di bawah (dipakai untuk drag
  // mouse di desktop) membuat browser me-retarget event mouseup/click ke
  // sliderTrack, bukan ke <img> ini — akibatnya klik gambar tidak pernah
  // kedeteksi khusus di mode desktop. Sebagai gantinya, kita simpan data
  // slide-nya di elemen (lewat properti custom) dan deteksi "klik vs drag"
  // secara manual di listener pointerup pada sliderTrack (lihat di bawah).
  imgEl._slideData = slideData;

  slideEl.appendChild(imgEl);
  sliderTrack.appendChild(slideEl);

  var dotEl = document.createElement('button');
  dotEl.className = 'dot' + (index === 0 ? ' active' : '');
  dotEl.setAttribute('aria-label', 'Ke slide ' + (index + 1));
  dotEl.addEventListener('click', function () {
    scrollToSlide(index);
  });
  sliderDots.appendChild(dotEl);
});

var currentSlideIndex = 0; // dipakai supaya tombol panah selalu geser tepat 1 slide

function getSlideStep() {
  // lebar 1 slide + gap di antara slide, dipakai untuk hitung posisi scroll
  return sliderTrack.children[0].getBoundingClientRect().width
    + parseFloat(getComputedStyle(sliderTrack).gap || 14);
}

function scrollToSlide(index) {
  var maxIndex = EVENT_SLIDES.length - 1;
  currentSlideIndex = Math.max(0, Math.min(index, maxIndex)); // jaga index tetap dalam rentang
  sliderTrack.scrollTo({ left: getSlideStep() * currentSlideIndex, behavior: 'smooth' });
}

// Tombol panah kiri/kanan — geser TEPAT SATU slide per klik (bukan per lebar layar,
// supaya tidak "loncat" beberapa foto sekaligus di mode desktop)
document.getElementById('sliderPrev').addEventListener('click', function () {
  scrollToSlide(currentSlideIndex - 1);
});
document.getElementById('sliderNext').addEventListener('click', function () {
  scrollToSlide(currentSlideIndex + 1);
});

// Update dot aktif & currentSlideIndex saat slider di-scroll (lewat swipe, drag, atau tombol)
var dotButtons = sliderDots.querySelectorAll('.dot');
var scrollTimeout;
sliderTrack.addEventListener('scroll', function () {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(function () {
    currentSlideIndex = Math.round(sliderTrack.scrollLeft / getSlideStep());
    dotButtons.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentSlideIndex);
    });
  }, 80);
});

// Drag pakai mouse untuk desktop (di HP, swipe jari sudah native lewat scroll-snap)
var isDragging = false;
var dragStartX = 0;
var dragStartScroll = 0;
var dragMoved = false;            // true kalau pointer benar-benar bergeser (bukan sekadar klik)
var DRAG_THRESHOLD_PX = 6;        // gerakan di bawah angka ini masih dianggap "klik", bukan drag
var pointerDownImg = null;        // <img> yang ada di bawah jari/kursor saat pointerdown

sliderTrack.addEventListener('pointerdown', function (e) {
  isDragging = true;
  dragMoved = false;
  pointerDownImg = e.target.closest('img');
  sliderTrack.classList.add('dragging');
  dragStartX = e.clientX;
  dragStartScroll = sliderTrack.scrollLeft;
  sliderTrack.setPointerCapture(e.pointerId);
});
sliderTrack.addEventListener('pointermove', function (e) {
  if (!isDragging) return;
  var delta = e.clientX - dragStartX;
  if (Math.abs(delta) > DRAG_THRESHOLD_PX) dragMoved = true;
  sliderTrack.scrollLeft = dragStartScroll - delta;
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
  sliderTrack.addEventListener(evt, function (e) {
    // PENTING: karena sliderTrack pakai setPointerCapture (di atas) untuk
    // mendukung drag-to-scroll pakai mouse, event klik native pada <img>
    // tidak reliable di mode desktop (browser me-retarget mouseup ke
    // sliderTrack). Jadi kita buka lightbox manual di sini: kalau pointer
    // TIDAK bergeser signifikan (dragMoved === false) dan pointerdown-nya
    // dimulai tepat di atas sebuah <img>, anggap itu sebagai klik gambar.
    if (evt === 'pointerup' && !dragMoved && pointerDownImg) {
      openLightbox(pointerDownImg._slideData);
    }
    isDragging = false;
    dragMoved = false;
    pointerDownImg = null;
    sliderTrack.classList.remove('dragging');
  });
});

/* ------------------------------------------------------------------------
   3. LIGHTBOX — buka foto ukuran penuh + tombol download
   ------------------------------------------------------------------------ */
var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightboxImg');
var lightboxDownload = document.getElementById('lightboxDownload');

function openLightbox(slideData) {
  lightboxImg.src = slideData.src;
  lightboxImg.alt = slideData.alt;
  lightboxDownload.href = slideData.src;
  lightboxDownload.setAttribute('download', slideData.downloadName || 'entiti-event.jpg');
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  trackCTAClick('open_event_photo'); // opsional: lacak seberapa sering foto dibuka
}
function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
}
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function (e) {
  if (e.target === lightbox) closeLightbox(); // klik di luar foto = tutup
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeLightbox();
});
lightboxDownload.addEventListener('click', function () {
  trackCTAClick('download_event_photo');
});

/* ------------------------------------------------------------------------
   4. ANIMASI ENTRANCE PER SECTION
   Mengamati semua elemen [data-animate], menambahkan class .is-visible
   begitu elemen itu masuk ke area yang terlihat (viewport) saat discroll.
   ------------------------------------------------------------------------ */
var animatedSections = document.querySelectorAll('[data-animate]');
var sectionObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      sectionObserver.unobserve(entry.target); // animasi cukup sekali per section
    }
  });
}, { threshold: 0.15 });
animatedSections.forEach(function (el) { sectionObserver.observe(el); });

/* ------------------------------------------------------------------------
   5. GOOGLE ANALYTICS 4 — helper untuk tombol CTA
   --------------------------------------------------------------------
   Pola ini sama dengan trackCTAClick di project Next.js: mengirim
   satu event GA4 setiap tombol penting diklik. Selama script gtag.js
   di index.html masih dikomentari, event ini cuma tampil di console
   log (aman untuk testing tanpa mengotori data GA4 asli).
   ------------------------------------------------------------------------ */
function trackCTAClick(label) {
  console.log('[Analytics] CTA clicked:', label);
  if (typeof gtag === 'function') {
    gtag('event', 'cta_click', {
      cta_label: label,
      page_location: window.location.href
    });
  }
}