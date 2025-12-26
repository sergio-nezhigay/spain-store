import { Component } from '@theme/component';

/**
 * CollectionsGrid component
 *
 * Tracks when titles approach the screen bottom for future repositioning.
 */
class CollectionsGrid extends Component {
  requiredRefs = ['items'];

  // Threshold distance from bottom (in pixels) to trigger logging
  static BOTTOM_THRESHOLD = 100;

  #rafId = null;
  #itemStates = new WeakMap(); // Track whether each item is in the zone

  connectedCallback() {
    super.connectedCallback();

    console.log('[CollectionsGrid] Connected', {
      itemCount: this.refs.items?.length
    });

    // Start tracking scroll
    window.addEventListener('scroll', this.#handleScroll, { passive: true });

    // Initial check
    this.#checkTitlePositions();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('[CollectionsGrid] Disconnected');

    window.removeEventListener('scroll', this.#handleScroll);

    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
    }
  }

  updatedCallback() {
    super.updatedCallback();
    console.log('[CollectionsGrid] Updated');
  }

  #handleScroll = () => {
    // Cancel previous frame
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
    }

    // Schedule new check
    this.#rafId = requestAnimationFrame(() => {
      this.#checkTitlePositions();
      this.#rafId = null;
    });
  };

  #checkTitlePositions() {
    const viewportHeight = window.innerHeight;
    const screenBottom = viewportHeight;

    for (const item of this.refs.items || []) {
      const content = item.querySelector('.collections-grid__content');
      if (!content) continue;

      const contentRect = content.getBoundingClientRect();
      const contentBottom = contentRect.bottom;
      const distanceFromScreenBottom = screenBottom - contentBottom;

      // Check if title is in the bottom zone
      const isInZone = Math.abs(distanceFromScreenBottom) < CollectionsGrid.BOTTOM_THRESHOLD;
      const wasInZone = this.#itemStates.get(item) || false;

      // Only log on state change (entering or exiting zone)
      if (isInZone !== wasInZone) {
        const titleElement = content.querySelector('.collections-grid__title');
        const titleText = titleElement ? titleElement.textContent.trim() : 'Unknown';

        if (isInZone) {
          console.log('[CollectionsGrid] ✅ Title ENTERED bottom zone:', {
            title: titleText,
            contentBottom: Math.round(contentBottom),
            screenBottom: Math.round(screenBottom),
            distanceFromBottom: Math.round(distanceFromScreenBottom)
          });
        } else {
          console.log('[CollectionsGrid] ❌ Title EXITED bottom zone:', {
            title: titleText
          });
        }

        // Update state
        this.#itemStates.set(item, isInZone);
      }
    }
  }
}

customElements.define('collections-grid-component', CollectionsGrid);
