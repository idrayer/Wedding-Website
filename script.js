const sections = [...document.querySelectorAll(".panel")];
const tabs = [...document.querySelectorAll(".tab")];
const galleries = [...document.querySelectorAll("[data-gallery]")];
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox__image");
const lightboxClose = document.querySelector(".lightbox__close");
const lightboxBackdrop = document.querySelector(".lightbox__backdrop");
const lightboxViewport = document.querySelector(".lightbox__viewport");
const zoomInButton = document.querySelector("[data-zoom-in]");
const zoomOutButton = document.querySelector("[data-zoom-out]");
const zoomResetButton = document.querySelector("[data-zoom-reset]");
const lightboxPreviousButton = document.querySelector("[data-lightbox-prev]");
const lightboxNextButton = document.querySelector("[data-lightbox-next]");

const galleryImagePools = {
  "our-story": [
    "Images/How We Got Here/IMG_0880.jpeg",
    "Images/How We Got Here/IMG_1225.jpeg",
    "Images/How We Got Here/IMG_2338.jpeg",
    "Images/How We Got Here/IMG_7922.jpeg",
    "Images/How We Got Here/IMG_8666.jpg",
    "Images/How We Got Here/IMG_9629.jpeg",
  ],
  "event-logistics": [
    "Images/When & Where/20250524_141756_Original.jpg",
    "Images/When & Where/IMG_2782.jpeg",
    "Images/When & Where/IMG_6536.jpeg",
    "Images/When & Where/IMG_8574.jpeg",
    "Images/When & Where/IMG_8778.JPEG",
    "Images/When & Where/IMG_9626.jpg",
    "Images/When & Where/IMG_9759.jpg",
  ],
  "where-to-stay": [
    "Images/Nearby Accommodations/IMG_0139.jpeg",
    "Images/Nearby Accommodations/IMG_1261.jpeg",
    "Images/Nearby Accommodations/IMG_6821.jpeg",
    "Images/Nearby Accommodations/IMG_6897.jpeg",
    "Images/Nearby Accommodations/IMG_8689.jpg",
    "Images/Nearby Accommodations/IMG_8721.JPEG",
  ],
  "things-to-do": [
    "Images/Wimberley & Hill Country Favorites/IMG_6700.jpeg",
    "Images/Wimberley & Hill Country Favorites/IMG_8600.jpeg",
    "Images/Wimberley & Hill Country Favorites/IMG_8615.jpg",
    "Images/Wimberley & Hill Country Favorites/IMG_8642.jpg",
    "Images/Wimberley & Hill Country Favorites/IMG_8799.jpg",
    "Images/Wimberley & Hill Country Favorites/IMG_9787.jpg",
  ],
  "important-links": [
    "Images/RSVPs and Registry/IMG_5812.JPG",
    "Images/RSVPs and Registry/IMG_8584.jpeg",
    "Images/RSVPs and Registry/IMG_8604.jpeg",
    "Images/RSVPs and Registry/IMG_8685.jpg",
    "Images/RSVPs and Registry/IMG_9654.jpg",
    "Images/RSVPs and Registry/IMG_9655.jpg",
    "Images/RSVPs and Registry/IMG_9725.jpg",
  ],
};

const carouselDelay = 10000;
const fadeDuration = 900;
const galleryStates = [];
let activeLightboxGallery = null;

const zoomState = {
  scale: 1,
  x: 0,
  y: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatAltText = (src) => {
  const fileName = src.split("/").pop().replace(/\.[^.]+$/, "");
  return `Wedding photo ${fileName.replaceAll("_", " ")}`;
};

const updateLightboxTransform = () => {
  if (!lightboxImage) {
    return;
  }

  lightboxImage.style.transform = `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;
  lightboxImage.classList.toggle("is-zoomed", zoomState.scale > 1);
};

const resetZoom = () => {
  zoomState.scale = 1;
  zoomState.x = 0;
  zoomState.y = 0;
  updateLightboxTransform();
};

const changeZoom = (amount) => {
  const nextScale = clamp(Number((zoomState.scale + amount).toFixed(2)), 1, 4);
  zoomState.scale = nextScale;

  if (nextScale === 1) {
    zoomState.x = 0;
    zoomState.y = 0;
  }

  updateLightboxTransform();
};

const buildGalleries = () => {
  galleries.forEach((gallery) => {
    const sectionId = gallery.closest(".panel")?.id;
    const imagePool = galleryImagePools[sectionId] || [];
    const imageButton = document.createElement("button");
    const imageA = document.createElement("img");
    const imageB = document.createElement("img");
    const controls = document.createElement("div");
    const previousButton = document.createElement("button");
    const nextButton = document.createElement("button");
    const counter = document.createElement("span");
    const state = {
      gallery,
      imagePool,
      images: [imageA, imageB],
      counter,
      index: 0,
      activeImage: 0,
      timerId: null,
      transitionTimerId: null,
      isTransitioning: false,
    };

    gallery.innerHTML = "";

    if (imagePool.length === 0) {
      gallery.textContent = "No photos found for this section.";
      return;
    }

    imageButton.className = "gallery__stage";
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", "Open wedding photo preview");

    [imageA, imageB].forEach((image, index) => {
      image.className = `gallery__image${index === 0 ? " is-active" : ""}`;
      image.alt = "";
      image.draggable = false;
      image.loading = index === 0 ? "eager" : "lazy";
    });

    controls.className = "gallery__controls";
    previousButton.className = "gallery__arrow";
    nextButton.className = "gallery__arrow";
    counter.className = "gallery__counter";

    previousButton.type = "button";
    nextButton.type = "button";
    previousButton.textContent = "‹";
    nextButton.textContent = "›";
    previousButton.setAttribute("aria-label", "Show previous photo");
    nextButton.setAttribute("aria-label", "Show next photo");

    imageButton.append(imageA, imageB);
    controls.append(previousButton, counter, nextButton);
    gallery.append(imageButton, controls);

    imageButton.addEventListener("click", () => openGalleryImage(state));
    previousButton.addEventListener("click", () => showGalleryImage(state, state.index - 1, { disableTimer: true }));
    nextButton.addEventListener("click", () => showGalleryImage(state, state.index + 1, { disableTimer: true }));

    showGalleryImage(state, 0, { immediate: true });
    if (imagePool.length > 1) {
      state.timerId = window.setInterval(() => showGalleryImage(state, state.index + 1), carouselDelay);
    }
    galleryStates.push(state);
  });
};

const stopGalleryTimer = (state) => {
  if (!state.timerId) {
    return;
  }

  window.clearInterval(state.timerId);
  state.timerId = null;
  state.gallery.classList.add("is-paused");
};

const openGalleryImage = (state) => {
  const src = state.imagePool[state.index];

  if (src) {
    openLightbox(src, formatAltText(src), state);
  }
};

const showGalleryImage = (state, nextIndex, options = {}) => {
  const { disableTimer = false, immediate = false } = options;
  const normalizedIndex = (nextIndex + state.imagePool.length) % state.imagePool.length;

  if (disableTimer) {
    stopGalleryTimer(state);
  }

  if (state.isTransitioning && !immediate) {
    return;
  }

  const activeImage = state.images[state.activeImage];
  const incomingImage = state.images[1 - state.activeImage];
  const src = state.imagePool[normalizedIndex];
  const alt = formatAltText(src);

  state.index = normalizedIndex;
  state.counter.textContent = `${normalizedIndex + 1} / ${state.imagePool.length}`;

  if (immediate) {
    window.clearTimeout(state.transitionTimerId);
    state.transitionTimerId = null;
    state.isTransitioning = false;
    activeImage.src = src;
    activeImage.alt = alt;
    activeImage.classList.add("is-active");
    incomingImage.classList.remove("is-active");
    return;
  }

  state.isTransitioning = true;
  window.clearTimeout(state.transitionTimerId);
  incomingImage.src = src;
  incomingImage.alt = alt;

  window.requestAnimationFrame(() => {
    incomingImage.classList.add("is-active");
    activeImage.classList.remove("is-active");
  });

  state.transitionTimerId = window.setTimeout(() => {
    state.activeImage = 1 - state.activeImage;
    state.isTransitioning = false;
    state.transitionTimerId = null;
  }, fadeDuration);
};

const setLightboxGalleryNav = (state) => {
  activeLightboxGallery = state;
  const showNav = Boolean(state && state.imagePool.length > 1);

  lightboxPreviousButton?.toggleAttribute("hidden", !showNav);
  lightboxNextButton?.toggleAttribute("hidden", !showNav);
};

const openLightbox = (src, alt, galleryState = null) => {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightboxImage.src = src;
  lightboxImage.alt = alt || "Wedding photo";
  setLightboxGalleryNav(galleryState);
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  resetZoom();
  lightboxClose?.focus();
};

const moveLightboxGallery = (direction) => {
  if (!activeLightboxGallery) {
    return;
  }

  showGalleryImage(activeLightboxGallery, activeLightboxGallery.index + direction, {
    disableTimer: true,
    immediate: true,
  });

  const src = activeLightboxGallery.imagePool[activeLightboxGallery.index];
  if (src && lightboxImage) {
    lightboxImage.src = src;
    lightboxImage.alt = formatAltText(src);
    resetZoom();
  }
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  document.body.classList.remove("lightbox-open");
  setLightboxGalleryNav(null);
  resetZoom();
};

const setActiveTab = (id) => {
  tabs.forEach((tab) => {
    const isActive = tab.getAttribute("href") === `#${id}`;
    tab.classList.toggle("is-active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) {
      setActiveTab(visible.target.id);
    }
  },
  {
    root: null,
    threshold: [0.35, 0.55, 0.75],
    rootMargin: "-15% 0px -55% 0px",
  }
);

sections.forEach((section) => observer.observe(section));
buildGalleries();

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".zoom-trigger");
  if (!trigger) {
    return;
  }

  const img = trigger.querySelector("img");
  const src = trigger.dataset.zoomSrc || img?.src;
  const alt = trigger.dataset.zoomAlt || img?.alt;
  if (src) {
    openLightbox(src, alt);
  }
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxBackdrop?.addEventListener("click", closeLightbox);
lightboxPreviousButton?.addEventListener("click", () => moveLightboxGallery(-1));
lightboxNextButton?.addEventListener("click", () => moveLightboxGallery(1));
zoomInButton?.addEventListener("click", () => changeZoom(0.5));
zoomOutButton?.addEventListener("click", () => changeZoom(-0.5));
zoomResetButton?.addEventListener("click", resetZoom);

lightboxViewport?.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
  },
  { passive: false }
);

lightboxViewport?.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".lightbox__nav")) {
    return;
  }

  if (zoomState.scale === 1) {
    return;
  }

  zoomState.isDragging = true;
  zoomState.startX = event.clientX - zoomState.x;
  zoomState.startY = event.clientY - zoomState.y;
  lightboxViewport.setPointerCapture(event.pointerId);
});

lightboxViewport?.addEventListener("pointermove", (event) => {
  if (!zoomState.isDragging) {
    return;
  }

  zoomState.x = event.clientX - zoomState.startX;
  zoomState.y = event.clientY - zoomState.startY;
  updateLightboxTransform();
});

lightboxViewport?.addEventListener("pointerup", (event) => {
  zoomState.isDragging = false;
  lightboxViewport.releasePointerCapture(event.pointerId);
});

lightboxViewport?.addEventListener("pointercancel", () => {
  zoomState.isDragging = false;
});

document.addEventListener("keydown", (event) => {
  if (!lightbox || lightbox.hidden) {
    return;
  }

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    moveLightboxGallery(-1);
  }

  if (event.key === "ArrowRight") {
    moveLightboxGallery(1);
  }

  if (event.key === "+" || event.key === "=") {
    changeZoom(0.5);
  }

  if (event.key === "-") {
    changeZoom(-0.5);
  }

  if (event.key === "0") {
    resetZoom();
  }
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.getAttribute("href").slice(1));
  });
});

const initialSection = window.location.hash.replace("#", "") || sections[0]?.id;
if (initialSection) {
  setActiveTab(initialSection);
}
