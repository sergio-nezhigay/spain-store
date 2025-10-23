import { CartUpdateEvent, CartAddEvent, ThemeEvents } from '@theme/events';

/**
 * A custom element that displays product recommendations in the cart drawer
 * based on the first item in the cart.
 *
 * @extends {HTMLElement}
 */
class CartDrawerRecommendations extends HTMLElement {
  /**
   * The cached recommendations by product ID
   * @type {Record<string, string>}
   */
  #cachedRecommendations = {};

  /**
   * An abort controller for the active fetch (if there is one)
   * @type {AbortController | null}
   */
  #activeFetch = null;

  /**
   * The current product ID being shown
   * @type {string | null}
   */
  #currentProductId = null;

  connectedCallback() {
    // Listen to cart events to refresh recommendations
    document.addEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate);
    document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);

    // Load initial recommendations
    this.#loadRecommendations();
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate);
    document.removeEventListener(CartAddEvent.eventName, this.#handleCartAdd);
  }

  /**
   * Handles cart update events
   * @param {CartUpdateEvent} event
   */
  #handleCartUpdate = (event) => {
    this.#loadRecommendations();
  };

  /**
   * Handles cart add events
   * @param {CartAddEvent} event
   */
  #handleCartAdd = (event) => {
    this.#loadRecommendations();
  };

  /**
   * Load the product recommendations based on first cart item
   */
  async #loadRecommendations() {
    try {
      // Fetch current cart to get first item
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      console.log('Cart drawer recommendations: Cart data', cart);

      // If cart is empty, hide recommendations
      if (!cart.items || cart.items.length === 0) {
        console.log('Cart drawer recommendations: Cart is empty, hiding');
        this.classList.add('hidden');
        return;
      }

      // Get first item's product ID
      const firstItem = cart.items[0];
      const productId = firstItem.product_id;

      console.log('Cart drawer recommendations: Product ID', productId);

      // If product ID hasn't changed, don't reload
      if (this.#currentProductId === String(productId)) {
        console.log('Cart drawer recommendations: Product ID unchanged, skipping');
        return;
      }

      this.#currentProductId = String(productId);

      // Show loading skeleton
      this.classList.remove('hidden');
      this.#showLoadingSkeleton();

      // Fetch recommendations
      const result = await this.#fetchCachedRecommendations(productId);

      console.log('Cart drawer recommendations: Fetch result', result);

      if (!result.success) {
        console.log('Cart drawer recommendations: Fetch failed, hiding');
        this.classList.add('hidden');
        return;
      }

      // Parse the section HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.data, 'text/html');

      console.log('Cart drawer recommendations: Parsed HTML', doc.body.innerHTML);

      // Look for the recommendations content in the parsed section
      const recommendationsContent = doc.querySelector('.cart-drawer-recommendations__content');
      const existingContent = this.querySelector('.cart-drawer-recommendations__content');

      if (recommendationsContent && existingContent) {
        console.log('Cart drawer recommendations: Found content, updating');
        console.log('Cart drawer recommendations: Debug - performed:', recommendationsContent.dataset.debugPerformed);
        console.log('Cart drawer recommendations: Debug - count:', recommendationsContent.dataset.debugCount);
        console.log('Cart drawer recommendations: Debug - size:', recommendationsContent.dataset.debugSize);

        existingContent.innerHTML = recommendationsContent.innerHTML;

        // Check if there are actual products (not just skeleton)
        const hasProducts = recommendationsContent.querySelector('.cart-drawer-recommendations__item');
        if (hasProducts) {
          console.log('Cart drawer recommendations: Has products, showing');
          this.classList.remove('hidden');
        } else {
          console.log('Cart drawer recommendations: No products found, hiding');
          this.classList.add('hidden');
        }
      } else {
        console.log('Cart drawer recommendations: Content not found, hiding');
        this.classList.add('hidden');
      }
    } catch (error) {
      console.error('Cart drawer recommendations error:', error);
      this.classList.add('hidden');
    }
  }

  /**
   * Show loading skeleton
   */
  #showLoadingSkeleton() {
    const existingContent = this.querySelector('.cart-drawer-recommendations__content');
    if (!existingContent) return;

    const skeletonHTML = `
      <div class="cart-drawer-recommendations__grid">
        ${Array(3).fill('').map(() => `
          <div class="cart-drawer-recommendations__skeleton-item" aria-label="Loading recommendations"></div>
        `).join('')}
      </div>
    `;
    existingContent.innerHTML = skeletonHTML;
  }

  /**
   * Fetches the recommendations and caches the result for future use
   * @param {string | number} productId
   * @returns {Promise<{ success: true, data: string } | { success: false, status: number }>}
   */
  async #fetchCachedRecommendations(productId) {
    const baseUrl = this.dataset.url;
    const sectionId = this.dataset.sectionId;
    const intent = 'complementary';
    const limit = this.dataset.limit || 3;

    if (!baseUrl) {
      console.error('Cart drawer recommendations: No URL provided in data-url attribute');
      return { success: false, status: 0 };
    }

    const url = `${baseUrl}?limit=${limit}&product_id=${productId}&section_id=${sectionId}&intent=${intent}`;

    console.log('Cart drawer recommendations: Fetching from URL', url);

    // Check cache
    const cachedResponse = this.#cachedRecommendations[url];
    if (cachedResponse) {
      console.log('Cart drawer recommendations: Using cached response');
      return { success: true, data: cachedResponse };
    }

    // Abort any pending fetch
    this.#activeFetch?.abort();
    this.#activeFetch = new AbortController();

    try {
      const response = await fetch(url, { signal: this.#activeFetch.signal });
      console.log('Cart drawer recommendations: Fetch response status', response.status);

      if (!response.ok) {
        console.log('Cart drawer recommendations: Response not OK');
        return { success: false, status: response.status };
      }

      const text = await response.text();
      console.log('Cart drawer recommendations: Response text length', text.length);

      this.#cachedRecommendations[url] = text;
      return { success: true, data: text };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Cart drawer recommendations: Fetch aborted');
        return { success: false, status: 0 };
      }
      console.log('Cart drawer recommendations: Fetch error', error);
      throw error;
    } finally {
      this.#activeFetch = null;
    }
  }
}

if (!customElements.get('cart-drawer-recommendations')) {
  customElements.define('cart-drawer-recommendations', CartDrawerRecommendations);
}
