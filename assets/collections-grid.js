import { Component } from '@theme/component';
import { isMobileBreakpoint } from '@theme/utilities';

/**
 * CollectionsGrid component
 *
 * Handles sticky scrolling title behavior for collection grid items on mobile.
 * Coordinates globally across all instances to ensure only one title is visible at a time.
 */
class CollectionsGrid extends Component {
  requiredRefs = ['items'];

  // Global state shared across all instances
  static instances = [];
  static activeTitle = null;
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
      CollectionsGrid.activeTitle = null;
    }
  }

  updatedCallback() {
    super.updatedCallback();

    console.log('[CollectionsGrid] Updated');

    if (this.#isActive) {
      requestAnimationFrame(() => {
        this.#updateTitlePositions();
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
    // Process all registered instances
    for (const instance of CollectionsGrid.instances) {
      if (instance.#isActive) {
        instance.#updateTitlePositions();
      }
    }
  }

  #updateTitlePositions() {
    const viewportHeight = window.innerHeight;

    // Batch read phase - get all DOM measurements
    const itemData = (this.refs.items || []).map(item => {
      const content = item.querySelector('.collections-grid__content');
      return {
        item,
        content,
        rect: item.getBoundingClientRect(),
      };
    });

    // Batch write phase - apply all style changes
    for (const data of itemData) {
      if (!data.content) continue;

      const imageBottom = data.rect.bottom;

      if (imageBottom <= viewportHeight) {
        // Image is in viewport - stick title to image
        const translateY = viewportHeight - imageBottom - 40;
        data.content.style.transform = `translateY(-${translateY}px)`;

        // Fade out when approaching the top
        if (imageBottom < 150) {
          const opacity = imageBottom / 150;
          data.content.style.opacity = String(opacity);

          // Clear active title if it's fading out
          if (opacity < 0.1 && CollectionsGrid.activeTitle === data.content) {
            CollectionsGrid.activeTitle = null;
          }
        } else {
          data.content.style.opacity = '1';

          // Set as active title
          if (CollectionsGrid.activeTitle !== data.content) {
            this.#setActiveTitle(data.content);
          }
        }
      } else {
        // Image below viewport - fixed position at bottom
        data.content.style.transform = 'translateY(0)';
        data.content.style.opacity = '1';
      }
    }
  }

  #setActiveTitle(newTitle) {
    // Fade out previous title (may be from different section!)
    if (CollectionsGrid.activeTitle && CollectionsGrid.activeTitle !== newTitle) {
      CollectionsGrid.activeTitle.style.opacity = '0';
    }

    CollectionsGrid.activeTitle = newTitle;
    newTitle.style.opacity = '1';
  }
}

customElements.define('collections-grid-component', CollectionsGrid);
