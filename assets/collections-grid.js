import { Component } from '@theme/component';

/**
 * CollectionsGrid component
 *
 * Handles title repositioning when approaching screen bottom.
 */
class CollectionsGrid extends Component {
  requiredRefs = ['items'];

  // Threshold distance from bottom (in pixels) to trigger sticky behavior
  static BOTTOM_THRESHOLD = 100;
  static STICKY_BOTTOM_OFFSET = 40; // pixels from screen bottom when sticky

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
    this.#updateTitlePositions();
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
      this.#updateTitlePositions();
      this.#rafId = null;
    });
  };

  #updateTitlePositions() {
    const viewportHeight = window.innerHeight;
    const screenBottom = viewportHeight;
    const stickyItems = [];

    // Step 1: Determine which titles should be sticky
    for (const item of this.refs.items || []) {
      const content = item.querySelector('.collections-grid__content');
      if (!content) continue;

      const itemRect = item.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      // Check if content bottom is near screen bottom AND image is still visible
      const contentBottom = contentRect.bottom;
      const distanceFromScreenBottom = screenBottom - contentBottom;
      const isImageVisible = itemRect.bottom > 0 && itemRect.top < viewportHeight;

      const shouldBeSticky =
        Math.abs(distanceFromScreenBottom) < CollectionsGrid.BOTTOM_THRESHOLD &&
        isImageVisible &&
        itemRect.bottom > CollectionsGrid.STICKY_BOTTOM_OFFSET;

      const wasInZone = this.#itemStates.get(item) || false;

      // Debug logging on state change
      if (shouldBeSticky !== wasInZone) {
        const titleElement = content.querySelector('.collections-grid__title');
        const titleText = titleElement ? titleElement.textContent.trim() : 'Unknown';

        if (shouldBeSticky) {
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

        this.#itemStates.set(item, shouldBeSticky);
      }

      if (shouldBeSticky) {
        stickyItems.push({ item, content, itemRect, contentRect });
      }

      // Apply or remove sticky class
      content.classList.toggle('is-sticky', shouldBeSticky);
    }

    // Step 2: Handle overlaps between sticky titles
    if (stickyItems.length > 1) {
      this.#handleOverlaps(stickyItems, screenBottom);
    } else {
      // No overlaps, ensure all items are visible
      for (const item of this.refs.items || []) {
        const content = item.querySelector('.collections-grid__content');
        if (content) {
          content.classList.remove('is-hidden');
        }
      }
    }
  }

  #handleOverlaps(stickyItems, screenBottom) {
    const stickyPosition = screenBottom - CollectionsGrid.STICKY_BOTTOM_OFFSET;

    // Determine which image is "active" - the one whose bounds contain the sticky position
    let activeItem = null;

    for (const { item, itemRect } of stickyItems) {
      // Check if sticky position falls within this image's vertical bounds
      if (stickyPosition >= itemRect.top && stickyPosition <= itemRect.bottom) {
        activeItem = item;
        break;
      }
    }

    // If no active item found (edge case), use the one closest to sticky position
    if (!activeItem) {
      let minDistance = Infinity;
      for (const { item, itemRect } of stickyItems) {
        const distance = Math.min(
          Math.abs(stickyPosition - itemRect.top),
          Math.abs(stickyPosition - itemRect.bottom)
        );
        if (distance < minDistance) {
          minDistance = distance;
          activeItem = item;
        }
      }
    }

    // Show only the active item's title, hide others
    for (const { item, content } of stickyItems) {
      const shouldHide = item !== activeItem;
      content.classList.toggle('is-hidden', shouldHide);

      if (shouldHide) {
        const titleElement = content.querySelector('.collections-grid__title');
        const titleText = titleElement ? titleElement.textContent.trim() : 'Unknown';
        console.log('[CollectionsGrid] 🙈 Title HIDDEN due to overlap:', { title: titleText });
      }
    }
  }
}

customElements.define('collections-grid-component', CollectionsGrid);
