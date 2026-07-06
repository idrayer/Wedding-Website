const sections = [...document.querySelectorAll(".panel")];
const tabs = [...document.querySelectorAll(".tab")];
const imageSlots = [...document.querySelectorAll(".random-section-image")];
const zoomTriggers = [...document.querySelectorAll(".zoom-trigger")];
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox__image");
const lightboxClose = document.querySelector(".lightbox__close");
const lightboxBackdrop = document.querySelector(".lightbox__backdrop");

const imagePool = [
  "Images/20250524_141756_Original.jpg",
  "Images/IMG_0139.jpeg",
  "Images/IMG_1225.jpeg",
  "Images/IMG_1261.jpeg",
  "Images/IMG_2782.jpeg",
  "Images/IMG_5812.JPG",
  "Images/IMG_8721.JPEG",
  "Images/IMG_8778.JPEG",
  "Images/IMG_9629.jpeg",
  "Images/IMG_9655.jpeg",
];

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const assignRandomImages = () => {
  const randomized = shuffle(imagePool);

  imageSlots.forEach((img, index) => {
    const src = randomized[index % randomized.length];
    img.src = src;
    img.alt = img.dataset.imageSlot
      ? `${img.dataset.imageSlot.replaceAll("-", " ")} image`
      : "Wedding photo";
  });
};

const openLightbox = (src, alt) => {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightboxImage.src = src;
  lightboxImage.alt = alt || "Wedding photo";
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  lightboxClose?.focus();
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  document.body.classList.remove("lightbox-open");
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
assignRandomImages();

zoomTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const img = trigger.querySelector("img");
    const src = trigger.dataset.zoomSrc || img?.src;
    const alt = trigger.dataset.zoomAlt || img?.alt;
    if (src) {
      openLightbox(src, alt);
    }
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxBackdrop?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) {
    closeLightbox();
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
