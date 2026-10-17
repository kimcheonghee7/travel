import "./site-auth.js";
import { equalTo, onValue, orderByChild, query, ref } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { database } from "./firebase-init.js";

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const backToTop = document.querySelector('.back-to-top');

const updateBackToTopVisibility = () => {
  if (backToTop) backToTop.hidden = window.scrollY <= 0;
};

updateBackToTopVisibility();
window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? '메뉴 열기' : '메뉴 닫기');
  primaryNav?.classList.toggle('is-open', !isOpen);
});

primaryNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', '메뉴 열기');
    primaryNav.classList.remove('is-open');
  });
});

document.querySelectorAll('.filter-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const selectedFilter = chip.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach((item) => {
      item.classList.remove('is-active');
      item.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('is-active');
    chip.setAttribute('aria-pressed', 'true');
    document.querySelectorAll('.destination-card').forEach((card) => {
      card.hidden = selectedFilter !== 'all' && card.dataset.category !== selectedFilter && card.dataset.category !== 'all';
    });
  });
});

const destinationGrid = document.querySelector('#destinations-grid');
const previewNote = document.querySelector('.preview-note');

onValue(query(ref(database, 'destinations'), orderByChild('isPublished'), equalTo(true)), (snapshot) => {
  const destinations = Object.values(snapshot.val() || {}).slice(0, 6);
  if (!destinations.length) return;
  destinationGrid.replaceChildren(...destinations.map(createDestinationCard));
  previewNote.textContent = '관리자가 등록한 공개 여행지입니다.';
}, () => {
  previewNote.textContent = 'Firebase 연결 후 등록한 여행지가 이곳에 표시됩니다.';
});

function createDestinationCard(item, index) {
  const article = document.createElement('article');
  article.className = `destination-card${index === 0 ? ' destination-card-large' : ''}`;
  article.dataset.category = item.category || 'all';
  const visual = document.createElement('a');
  visual.className = 'destination-visual firebase-visual';
  visual.href = 'html/reservation.html';
  visual.setAttribute('aria-label', `${item.name || '여행지'} 예약하기`);
  const tag = document.createElement('span');
  tag.className = 'visual-tag';
  tag.textContent = item.region || '추천 여행지';
  const number = document.createElement('span');
  number.className = 'visual-number';
  number.textContent = String(index + 1).padStart(2, '0');
  visual.append(tag, number);
  if (item.imageUrl) {
    try {
      const imageUrl = new URL(item.imageUrl);
      if (imageUrl.protocol === 'https:' || imageUrl.protocol === 'http:') {
        const image = document.createElement('img');
        image.src = imageUrl.href;
        image.alt = '';
        image.loading = 'lazy';
        visual.append(image);
      }
    } catch { /* Ignore invalid image URLs and retain the fallback artwork. */ }
  }
  const info = document.createElement('div');
  info.className = 'destination-info';
  const copy = document.createElement('div');
  const region = document.createElement('p');
  region.className = 'destination-region';
  region.textContent = item.region || '국내 여행';
  const title = document.createElement('h3');
  title.textContent = item.name || '이름 없는 여행지';
  copy.append(region, title);
  const action = document.createElement('a');
  action.className = 'round-arrow';
  action.href = 'html/reservation.html';
  action.setAttribute('aria-label', `${item.name || '여행지'} 예약하기`);
  action.textContent = '↗';
  info.append(copy, action);
  const summary = document.createElement('p');
  summary.className = 'destination-summary';
  summary.textContent = item.summary || '';
  article.append(visual, info, summary);
  return article;
}
