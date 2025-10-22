class ProductRecommendations extends HTMLElement {
  /**
   * The observer for the product recommendations
   * @type {IntersectionObserver}
   */
  #intersectionObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries[0]?.isIntersecting) return;

      observer.disconnect();
      this.#loadRecommendations();
    },
    { rootMargin: '0px 0px 400px 0px' }
  );

  /**
   * Observing changes to the elements attributes
   * @type {MutationObserver}
   */
  #mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Only attribute changes are interesting
      if (mutation.target !== this || mutation.type !== 'attributes') continue;

      // Ignore error attribute changes
      if (mutation.attributeName === 'data-error') continue;

      // Ignore addition of hidden class because it means there's an error with the display
      if (mutation.attributeName === 'class' && this.classList.contains('hidden')) continue;

      // Ignore when the data-recommendations-performed attribute has been set to 'true'
      if (
        mutation.attributeName === 'data-recommendations-performed' &&
        this.dataset.recommendationsPerformed === 'true'
      )
        continue;

      // All other attribute changes trigger a reload
      this.#loadRecommendations();
      break;
    }
  });

  /**
   * The cached recommendations
   * @type {Record<string, string>}
   */
  #cachedRecommendations = {};

  /**
   * An abort controller for the active fetch (if there is one)
   * @type {AbortController | null}
   */
  #activeFetch = null;

  connectedCallback() {
    this.#intersectionObserver.observe(this);
    this.#mutationObserver.observe(this, { attributes: true });
  }

  /**
   * Load the product recommendations
   */
  #loadRecommendations() {
    const { productId, recommendationsPerformed, sectionId, intent } = this.dataset;
    const id = this.id;

    console.log('[Product Recommendations] Loading recommendations:', {
      productId,
      sectionId,
      intent,
      elementId: id
    });

    if (!productId || !id) {
      throw new Error('Product ID and an ID attribute are required');
    }

    // If the recommendations have already been loaded, accounts for the case where the Theme Editor
    // is loaded the section from the editor's visual preview context.
    if (recommendationsPerformed === 'true') {
      console.log('[Product Recommendations] Already loaded, skipping');
      return;
    }

    this.#fetchCachedRecommendations(productId, sectionId, intent)
      .then((result) => {
        if (!result.success) {
          console.error('[Product Recommendations] API request failed:', {
            status: result.status,
            productId,
            sectionId,
            intent
          });
          // The Theme Editor will place a section element element in the DOM whose section_id is not available
          // to the Section Renderer API. In this case, we can safely ignore the error.
          if (!Shopify.designMode) {
            this.#handleError(new Error(`Server returned ${result.status}`));
          }
          return;
        }

        const html = document.createElement('div');
        html.innerHTML = result.data || '';
        const recommendations = html.querySelector(`product-recommendations[id="${id}"]`);

        if (recommendations?.innerHTML && recommendations.innerHTML.trim().length) {
          console.log('[Product Recommendations] Successfully loaded recommendations');
          this.dataset.recommendationsPerformed = 'true';
          this.innerHTML = recommendations.innerHTML;
        } else {
          console.warn('[Product Recommendations] No recommendations in response:', {
            hasRecommendationsElement: !!recommendations,
            htmlLength: recommendations?.innerHTML?.length || 0,
            responseDataLength: result.data?.length || 0
          });
          this.#handleError(new Error('No recommendations available'));
        }
      })
      .catch((e) => {
        console.error('[Product Recommendations] Fetch error:', e);
        this.#handleError(e);
      });
  }

  /**
   * Fetches the recommendations and cached the result for future use
   * @param {string} productId
   * @param {string | undefined} sectionId
   * @param {string | undefined} intent
   * @returns {Promise<{ success: true, data: string } | { success: false, status: number }>}
   */
  async #fetchCachedRecommendations(productId, sectionId, intent) {
    const url = `${this.dataset.url}&product_id=${productId}&section_id=${sectionId}&intent=${intent}`;

    console.log('[Product Recommendations] Fetching from URL:', url);

    const cachedResponse = this.#cachedRecommendations[url];
    if (cachedResponse) {
      console.log('[Product Recommendations] Using cached response');
      return { success: true, data: cachedResponse };
    }

    this.#activeFetch?.abort();
    this.#activeFetch = new AbortController();

    try {
      const response = await fetch(url, { signal: this.#activeFetch.signal });
      console.log('[Product Recommendations] API Response status:', response.status);

      if (!response.ok) {
        return { success: false, status: response.status };
      }

      const text = await response.text();
      console.log('[Product Recommendations] Response length:', text.length, 'characters');
      this.#cachedRecommendations[url] = text;
      return { success: true, data: text };
    } finally {
      this.#activeFetch = null;
    }
  }

  /**
   * Handle errors in a consistent way
   * @param {Error} error
   */
  #handleError(error) {
    console.error('[Product Recommendations] Error:', {
      message: error.message,
      productId: this.dataset.productId,
      sectionId: this.dataset.sectionId,
      intent: this.dataset.intent
    });
    this.classList.add('hidden');
    this.dataset.error = error.message;
  }
}

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', ProductRecommendations);
}
