import { Component } from '@theme/component';
import { isMobileBreakpoint } from '@theme/utilities';

/**
 * CollectionsGrid component
 *
 * Handles sticky scrolling title behavior for collection grid items on mobile.
 * Coordinates globally across all instances to ensure titles don't overlap.
 */
class CollectionsGrid extends Component {
  requiredRefs = ['items'];

  // Global state shared across all instances
  static instances = [];
  static rafId = null;

  // Instance state
  #isActive = false;
  #resizeObserver = null;

  connectedCallback() {
    super.connectedCallback();

    console.log('[CollectionsGrid] Connected', {
      itemCount: this.refs.items?.length
    });

    // Register this instance globally
    CollectionsGrid.instances.push(this);

    // Monitor breakpoint changes
    this.#resizeObserver = new ResizeObserver(this.#handleResize);
    this.#resizeObserver.observe(document.body);

    // Initialize on mobile
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

    // Reset all styles
    for (const item of this.refs.items || []) {
      const content = item.querySelector('.collections-grid__content');
      if (content) {
        content.style.transform = '';
        content.style.opacity = '';
      }
    }
  }

  #handleResize = () => {
    const isMobile = isMobileBreakpoint();

    if (isMobile && !this.#isActive) {
      this.#enable();
    } else if (!isMobile && this.#isActive) {
      this.#disable();
    }
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
    const visibleRects = []; // Keep track of occupied spaces {top, bottom}

    // Collect all items from all active instances in DOM order
    for (const instance of CollectionsGrid.instances) {
      if (!instance.#isActive) continue;

      // Batch read phase for this instance
      const itemData = (instance.refs.items || []).map(item => {
        const content = item.querySelector('.collections-grid__content');
        if (!content) return null;

        return {
          content,
          rect: item.getBoundingClientRect(),
          contentHeight: content.offsetHeight
        };
      }).filter(Boolean);

      // Process items
      for (const data of itemData) {
        const imageBottom = data.rect.bottom;
        let visualBottom;
        let opacity = 1;
        let transformY = 0;

        if (imageBottom <= viewportHeight) {
          // Image is in viewport - stick title to image
          visualBottom = imageBottom;

          // Calculate transform needed to place it there
          // Default position is bottom: 40px (viewportHeight - 40)
          // We want it at imageBottom
          const offset = viewportHeight - imageBottom - 40;
          transformY = -offset;

          // Fade out when approaching the top
          if (imageBottom < 150) {
            opacity = Math.max(0, imageBottom / 150);
          }
        } else {
          // Image below viewport - fixed position at bottom
          visualBottom = viewportHeight - 40;
          transformY = 0;
        }

        const visualTop = visualBottom - data.contentHeight;

        // Check collision with previously visible titles
        let isOverlapping = false;

        // Only check collision if we are not already fading out due to scroll
        if (opacity > 0.1) {
           for (const rect of visibleRects) {
             // Check if rectangles overlap on Y axis
             // We add a small buffer (e.g. 5px) to avoid flickering when they are just touching
             if (visualTop < rect.bottom - 5 && visualBottom > rect.top + 5) {
               isOverlapping = true;
               break;
             }
           }
        }

        // Apply styles
        if (isOverlapping) {
          data.content.style.opacity = '0';
          data.content.style.transform = `translateY(${transformY}px)`;
        } else {
          data.content.style.opacity = String(opacity);
          data.content.style.transform = `translateY(${transformY}px)`;

          // Register this space as occupied if it's visible
          if (opacity > 0.1) {
            visibleRects.push({ top: visualTop, bottom: visualBottom });
          }
        }
      }
    }
  }
}

customElements.define('collections-grid-component', CollectionsGrid);
