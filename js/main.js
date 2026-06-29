// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    once: true,
    offset: 100
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        document.getElementById('navbar').classList.add('scrolled');
    } else {
        document.getElementById('navbar').classList.remove('scrolled');
    }
});

// Add active state to navigation links based on scroll position
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Let the introduction leave naturally, then add a subtle fade near its end.
// Moving the entire header created a visual overlap with the research section.
function updateIntroductionFade() {
    const header = document.querySelector('header');
    const headerContent = document.querySelector('.header-content');
    if (!header || !headerContent) {
        return;
    }

    const headerBottom = header.getBoundingClientRect().bottom;
    const fadeStart = window.innerHeight * 0.45;
    const fadeEnd = window.innerHeight * 0.15;
    const progress = Math.max(0, Math.min(1,
        (fadeStart - headerBottom) / (fadeStart - fadeEnd)
    ));

    headerContent.style.opacity = String(1 - progress);
    headerContent.style.transform = `translateY(${-16 * progress}px)`;
}

let introductionFadeFrame;
function requestIntroductionFade() {
    if (introductionFadeFrame) {
        return;
    }

    introductionFadeFrame = window.requestAnimationFrame(() => {
        updateIntroductionFade();
        introductionFadeFrame = null;
    });
}

window.addEventListener('scroll', requestIntroductionFade, { passive: true });
window.addEventListener('resize', requestIntroductionFade);

// Scholar stats and categorized research
let researchDataPromise;

function loadResearchData() {
    if (!researchDataPromise) {
        researchDataPromise = fetch('./assets/data/scholar_stats.json').then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    }

    return researchDataPromise;
}

function updateScholarStats(data) {
    const stats = {
        'citation-count': data.citations,
        'publication-count': data.publications,
        'h-index': data.h_index,
        'last-updated': data.last_updated
    };

    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? '—';
        }
    });
}

function createPublicationItem(publication, abstractId) {
    const item = document.createElement('article');
    item.className = 'publication-item';
    item.setAttribute('data-aos', 'fade-up');

    const year = document.createElement('div');
    year.className = 'publication-year';
    year.textContent = publication.year || 'Year unavailable';
    item.appendChild(year);

    const heading = document.createElement('h4');
    if (publication.url) {
        const link = document.createElement('a');
        link.href = publication.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = publication.title;
        heading.appendChild(link);
    } else {
        heading.textContent = publication.title;
    }
    item.appendChild(heading);

    if (publication.authors) {
        const authors = document.createElement('p');
        authors.className = 'publication-authors';
        authors.textContent = publication.authors;
        item.appendChild(authors);
    }

    if (publication.citation) {
        const citation = document.createElement('p');
        citation.className = 'journal';
        citation.textContent = publication.citation;
        item.appendChild(citation);
    }

    if (publication.abstract) {
        const button = document.createElement('button');
        button.className = 'abstract-toggle';
        button.type = 'button';
        button.textContent = 'Show Abstract';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', abstractId);

        const abstract = document.createElement('div');
        abstract.className = 'abstract';
        abstract.id = abstractId;
        abstract.hidden = true;
        abstract.textContent = publication.abstract;

        button.addEventListener('click', () => {
            const willOpen = abstract.hidden;
            abstract.hidden = !willOpen;
            button.textContent = willOpen ? 'Hide Abstract' : 'Show Abstract';
            button.setAttribute('aria-expanded', String(willOpen));
        });

        item.appendChild(button);
        item.appendChild(abstract);
    }

    return item;
}

function renderPublicationCategory(publications, containerId, categoryKey) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!Array.isArray(publications) || publications.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'publication-empty';
        emptyMessage.textContent = 'No papers listed yet.';
        container.appendChild(emptyMessage);
        return;
    }

    publications.forEach((publication, index) => {
        container.appendChild(
            createPublicationItem(publication, `abstract-${categoryKey}-${index}`)
        );
    });
}

async function updateResearchSection() {
    try {
        const data = await loadResearchData();
        const categories = data.publication_categories || {};

        updateScholarStats(data);
        renderPublicationCategory(categories.peer_reviewed, 'peer-reviewed-list', 'peer-reviewed');
        renderPublicationCategory(categories.working_papers, 'working-papers-list', 'working-papers');
        renderPublicationCategory(categories.works_in_progress, 'works-in-progress-list', 'works-in-progress');

        const allPublications = document.getElementById('all-publications');
        if (allPublications) {
            const combined = [
                ...(categories.peer_reviewed || []),
                ...(categories.working_papers || []),
                ...(categories.works_in_progress || [])
            ];
            renderPublicationCategory(combined, 'all-publications', 'all-publications');
        }
    } catch (error) {
        console.error('Error updating research data:', error);
        document.querySelectorAll('.publication-loading').forEach(message => {
            message.className = 'publication-error';
            message.textContent = 'Publication data could not be loaded.';
        });
    }
}

// Retain the legacy function name used by curriculum_vitae.html.
function updatePublications_all() {
    return updateResearchSection();
}

// Single DOMContentLoaded event listener for all initializations
document.addEventListener('DOMContentLoaded', function() {
    updateIntroductionFade();

    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinksItems.forEach(item => {
            item.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update Scholar metrics and categorized research.
    updateResearchSection();
});

// Optional: Add loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});


