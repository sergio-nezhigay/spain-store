import { Component } from '@theme/component';

/**
 * CollectionsGrid component
 *
 * Shows a sticky title at the bottom on mobile that updates based on
 * which collection image is currently visible at that position.
 */
class CollectionsGrid extends Component {
  requiredRefs = ['items'];

  #rafId = null;
  #stickyTitle = null;
  #currentActiveItem = null;

  connectedCallback() {
    super.connectedCallback();

    console.log('[CollectionsGrid] Connected', {
      itemCount: this.refs.items?.length
    });

    // Create sticky title element for mobile
    this.#createStickyTitle();

    // Start tracking scroll
    window.addEventListener('scroll', this.#handleScroll, { passive: true });
    window.addEventListener('resize', this.#handleScroll, { passive: true });

    // Initial check
    this.#updateStickyTitle();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('[CollectionsGrid] Disconnected');

    window.removeEventListener('scroll', this.#handleScroll);
    window.removeEventListener('resize', this.#handleScroll);

    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
    }

    // Remove sticky title
    if (this.#stickyTitle && this.#stickyTitle.parentNode) {
      this.#stickyTitle.remove();
    }
  }

  updatedCallback() {
    super.updatedCallback();
    console.log('[CollectionsGrid] Updated');
    this.#updateStickyTitle();
  }

  #createStickyTitle() {
    this.#stickyTitle = document.createElement('div');
    this.#stickyTitle.className = 'collections-grid__sticky-title';
    this.#stickyTitle.innerHTML = `
      <a href="#" class="collections-grid__sticky-link">
        <h2 class="collections-grid__sticky-text"></h2>
        <div class="collections-grid__sticky-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </a>
    `;
    this.appendChild(this.#stickyTitle);
  }

  #handleScroll = () => {
    // Cancel previous frame
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
    }

    // Schedule new check
    this.#rafId = requestAnimationFrame(() => {
      this.#updateStickyTitle();
      this.#rafId = null;
    });
  };

  #updateStickyTitle() {
    if (!this.#stickyTitle) return;

    // Check if mobile (you can adjust this breakpoint)
    const isMobile = window.innerWidth < 750;

    if (!isMobile) {
      this.#stickyTitle.classList.remove('is-visible');
      return;
    }

    const viewportHeight = window.innerHeight;
    const stickyPosition = viewportHeight - 40; // 40px from bottom

    let activeItem = null;
    let maxOverlap = 0;

    // Find which collection item is most visible at the sticky position
    for (const item of this.refs.items || []) {
      const rect = item.getBoundingClientRect();

      // Check if the item is visible in viewport
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        // Calculate how much the sticky position overlaps with this item
        const overlapTop = Math.max(rect.top, 0);
        const overlapBottom = Math.min(rect.bottom, viewportHeight);
        const overlap = overlapBottom - overlapTop;

        // Check if sticky position is within this item
        if (stickyPosition >= rect.top && stickyPosition <= rect.bottom) {
          // This item contains the sticky position
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            activeItem = item;
          }
        }
      }
    }

    // Update sticky title if active item changed
    if (activeItem !== this.#currentActiveItem) {
      this.#currentActiveItem = activeItem;

      if (activeItem) {
        const titleElement = activeItem.querySelector('.collections-grid__title');
        const linkElement = activeItem.querySelector('.collections-grid__link');
        const titleText = titleElement ? titleElement.textContent.trim() : '';
        const href = linkElement ? linkElement.getAttribute('href') : '#';

        const stickyText = this.#stickyTitle.querySelector('.collections-grid__sticky-text');
        const stickyLink = this.#stickyTitle.querySelector('.collections-grid__sticky-link');

        if (stickyText) stickyText.textContent = titleText;
        if (stickyLink) stickyLink.setAttribute('href', href);

        // Copy styles from the original title element
        if (titleElement && stickyText) {
          const computedStyle = window.getComputedStyle(titleElement);
          stickyText.style.fontSize = computedStyle.fontSize;
          stickyText.style.color = computedStyle.color;
          stickyText.style.fontWeight = computedStyle.fontWeight;
          stickyText.style.textTransform = computedStyle.textTransform;
          stickyText.style.letterSpacing = computedStyle.letterSpacing;
          stickyText.style.lineHeight = computedStyle.lineHeight;
        }

        // Copy arrow color from the original arrow element
        const arrowElement = activeItem.querySelector('.collections-grid__arrow');
        const stickyArrow = this.#stickyTitle.querySelector('.collections-grid__sticky-arrow');
        if (arrowElement && stickyArrow) {
          const arrowStyle = window.getComputedStyle(arrowElement);
          stickyArrow.style.color = arrowStyle.color;
        }

        this.#stickyTitle.classList.add('is-visible');

        console.log('[CollectionsGrid] Sticky title updated:', {
          title: titleText,
          href: href
        });
      } else {
        this.#stickyTitle.classList.remove('is-visible');
      }
    }
  }
}

customElements.define('collections-grid-component', CollectionsGrid);
