import { Component } from '@theme/component';
import { isMobileBreakpoint } from '@theme/utilities';

/**
 * CollectionsGrid component
 *
 * Tracks collection grid scroll position and logs debug information
 * when content elements are near the screen bottom on mobile.
 */
class CollectionsGrid extends Component {
  requiredRefs = ['items'];

  // Global state shared across all instances
  static instances = [];
  static rafId = null;

  // Instance state
  #isActive = false;
  #resizeObserver = null;
  #hasLogged = new Map(); // Track if item has already logged in current zone

  connectedCallback() {
    super.connectedCallback();

    console.log('[CollectionsGrid] Connected', {
      itemCount: this.refs.items?.length
    });

    // Register this instance globally
    CollectionsGrid.instances.push(this);

    // Enable scroll tracking for debug logs on mobile
    if (isMobileBreakpoint()) {
      this.#enable();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    console.log('[CollectionsGrid] Disconnected');

    // Unregister this instance
    const index = CollectionsGrid.instances.indexOf(this);
    if (index > -1) {
      CollectionsGrid.instances.splice(index, 1);
    }

    this.#disable();
    this.#resizeObserver?.disconnect();

    // Clean up global state if this was the last instance
    if (CollectionsGrid.instances.length === 0) {
      window.removeEventListener('scroll', this.#handleScroll);
      if (CollectionsGrid.rafId) {
        cancelAnimationFrame(CollectionsGrid.rafId);
        CollectionsGrid.rafId = null;
      }
    }
  }

  updatedCallback() {
    super.updatedCallback();

    console.log('[CollectionsGrid] Updated');

    if (this.#isActive) {
      requestAnimationFrame(() => {
        this.#updateAllInstances();
      });
    }
  }

  #enable() {
    if (this.#isActive) return;
    this.#isActive = true;

    console.log('[CollectionsGrid] Enabled');

    // First instance sets up the scroll listener
    if (CollectionsGrid.instances[0] === this) {
      window.addEventListener('scroll', this.#handleScroll, { passive: true });
    }

    // Initial calculation
    this.#handleScroll();
  }

  #disable() {
    if (!this.#isActive) return;
    this.#isActive = false;

    console.log('[CollectionsGrid] Disabled');
  }

#handleResize = () => {
  if (!this.#isActive) return;

  requestAnimationFrame(() => {
    this.#updateAllInstances();
  });
};


  #handleScroll = () => {
    if (!isMobileBreakpoint()) return;

    // Cancel previous frame
    if (CollectionsGrid.rafId) {
      cancelAnimationFrame(CollectionsGrid.rafId);
    }

    // Schedule new frame
    CollectionsGrid.rafId = requestAnimationFrame(() => {
      this.#updateAllInstances();
      CollectionsGrid.rafId = null;
    });
  };

  #updateAllInstances() {
    const viewportHeight = window.innerHeight;
    const viewportBottom = viewportHeight;
    const bottomThreshold = 100; // Log when content is within 100px of screen bottom

    // Collect all items from all active instances in DOM order
    for (const instance of CollectionsGrid.instances) {
      if (!instance.#isActive) continue;

      // Batch read phase for this instance
      const itemData = (instance.refs.items || []).map((item, index) => {
        const content = item.querySelector('.collections-grid__content');
        if (!content) return null;

        return {
          content,
          rect: item.getBoundingClientRect(),
          contentRect: content.getBoundingClientRect(),
          contentHeight: content.offsetHeight,
          index
        };
      }).filter(Boolean);

      // Process items and add debug logs
      for (const data of itemData) {
        const contentBottom = data.contentRect.bottom;
        const contentTop = data.contentRect.top;
        const distanceFromBottom = viewportBottom - contentBottom;

        const isInZone = contentBottom > 0 && distanceFromBottom >= 0 && distanceFromBottom <= bottomThreshold;

        if (isInZone) {
          // Log only once when entering the zone
          if (!instance.#hasLogged.get(data.index)) {
            console.log('[CollectionsGrid] Content near screen bottom:', {
              itemIndex: data.index,
              contentBottom: Math.round(contentBottom),
              viewportBottom: Math.round(viewportBottom),
              distanceFromBottom: Math.round(distanceFromBottom),
              contentTop: Math.round(contentTop),
              contentHeight: data.contentHeight,
              isVisible: contentTop < viewportHeight && contentBottom > 0
            });
            instance.#hasLogged.set(data.index, true);
          }
        } else {
          // Reset when leaving the zone so it can log again next time
          if (instance.#hasLogged.get(data.index)) {
            instance.#hasLogged.set(data.index, false);
          }
        }
      }
    }
  }
}

customElements.define('collections-grid-component', CollectionsGrid);
