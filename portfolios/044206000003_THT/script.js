/* ==========================================================================
   TRAN HUU THANH — EDITORIAL PORTFOLIO JAVASCRIPT
   Aesthetic: Hallmark Editorial Specimen
   Functionality:
   1. Dynamic Typographic Ticker / Typewriter
   2. Archival Light / Dark Mode Toggle with Persistence
   3. Architectural Taxonomy Filter
   4. Scroll-Spy Active Index Observer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. DYNAMIC TYPOGRAPHIC TYPEWRITER ---
  const typingElement = document.getElementById('typingText');
  const disciplines = [
    'Relational Schema & Database Architecture',
    'Fullstack Web Interfaces & Semantic UI',
    'Information Technology Scholar @ UTH',
    'Applied AI & Systems Engineering'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typeSpeed = 50;
  const deleteSpeed = 28;
  const delayBetweenPhrases = 2200;

  function typeTick() {
    if (!typingElement) return;

    const currentPhrase = disciplines[phraseIndex];

    if (isDeleting) {
      typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let nextSpeed = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === currentPhrase.length) {
      nextSpeed = delayBetweenPhrases;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % disciplines.length;
      nextSpeed = 350;
    }

    setTimeout(typeTick, nextSpeed);
  }

  typeTick();


  // --- 2. ARCHIVAL THEME SWITCHER (DARK / LIGHT WITH PERSISTENCE) ---
  const themeBtn = document.getElementById('themeBtn');
  const storedTheme = localStorage.getItem('tht_editorial_theme');

  if (storedTheme === 'light') {
    document.body.classList.add('light-mode');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('tht_editorial_theme', isLight ? 'light' : 'dark');
    });
  }


  // --- 3. ARCHITECTURAL TAXONOMY DOMAIN FILTER ---
  const ribbonButtons = document.querySelectorAll('.ribbon-btn');
  const taxonomyCards = document.querySelectorAll('.taxonomy-card');

  ribbonButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      ribbonButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const targetDomain = btn.getAttribute('data-type');

      taxonomyCards.forEach((card) => {
        const cardDomain = card.getAttribute('data-type');
        if (targetDomain === 'all' || cardDomain === targetDomain) {
          card.style.display = 'flex';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });


  // --- 4. SCROLL-SPY ACTIVE INDEX OBSERVER ---
  const sections = document.querySelectorAll('.editorial-section');
  const indexLinks = document.querySelectorAll('.index-link');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          indexLinks.forEach((link) => {
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((sec) => sectionObserver.observe(sec));
  }

});
