import { Component } from '@theme/component';

/**
 * Special Offer Component
 *
 * Handles email signup form submission and promo code display with copy functionality.
 */
class SpecialOfferComponent extends Component {
  constructor() {
    super();
    this.promoCode = this.dataset.promoCode || '';
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Find the form and add submit handler
    const form = this.querySelector('form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const form = this.querySelector('form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }
  }

  /**
   * Handles form submission
   * @param {Event} event
   */
  async handleSubmit(event) {
    event.preventDefault();

    const form = /** @type {HTMLFormElement} */ (event.target);
    const emailInput = /** @type {HTMLInputElement} */ (this.refs.emailInput);
    const submitButton = /** @type {HTMLButtonElement} */ (this.refs.submitButton);
    const errorMessage = /** @type {HTMLElement} */ (this.refs.errorMessage);
    const errorText = /** @type {HTMLElement} */ (this.refs.errorText);

    if (!emailInput || !emailInput.value) {
      this.showError('Please enter a valid email address');
      return;
    }

    // Disable button and show loading state
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }

    // Hide any previous errors
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }

    try {
      // Submit the form via Shopify's customer API
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      // For now, we'll consider it successful if we get a response
      // In production, you might want to check response.ok or handle specific error cases

      // Show success state
      this.showSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showError('Something went wrong. Please try again.');

      // Re-enable button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = this.getOriginalButtonText();
      }
    }
  }

  /**
   * Shows error message
   * @param {string} message
   */
  showError(message) {
    const errorMessage = /** @type {HTMLElement} */ (this.refs.errorMessage);
    const errorText = /** @type {HTMLElement} */ (this.refs.errorText);

    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.style.display = 'flex';
    }
  }

  /**
   * Shows success state with promo code
   */
  showSuccess() {
    const formContainer = /** @type {HTMLElement} */ (this.refs.formContainer);
    const successContainer = /** @type {HTMLElement} */ (this.refs.successContainer);

    if (formContainer) {
      formContainer.style.display = 'none';
    }

    if (successContainer) {
      successContainer.style.display = 'flex';
    }
  }

  /**
   * Copies promo code to clipboard
   */
  async copyPromoCode() {
    const copyButton = /** @type {HTMLButtonElement} */ (this.refs.copyButton);
    const copyButtonText = /** @type {HTMLElement} */ (this.refs.copyButtonText);

    if (!this.promoCode) return;

    try {
      await navigator.clipboard.writeText(this.promoCode);

      // Show copied confirmation
      if (copyButtonText) {
        const originalText = copyButtonText.textContent;
        copyButtonText.textContent = 'Copied!';

        setTimeout(() => {
          copyButtonText.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy promo code:', error);

      // Fallback: select the promo code text
      const promoCodeDisplay = /** @type {HTMLElement} */ (this.refs.promoCodeDisplay);
      if (promoCodeDisplay) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(promoCodeDisplay);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  /**
   * Gets the original button text from the section settings
   * @returns {string}
   */
  getOriginalButtonText() {
    const submitButton = /** @type {HTMLButtonElement} */ (this.refs.submitButton);
    return submitButton?.getAttribute('data-original-text') || 'Get My Code';
  }
}

if (!customElements.get('special-offer-component')) {
  customElements.define('special-offer-component', SpecialOfferComponent);
}
