import { Component } from '@theme/component';

/**
 * A custom element that manages the size chart functionality.
 *
 * This component wraps a dialog-component and provides methods to open and close
 * the size chart modal. It's a lightweight wrapper that delegates to the dialog component.
 *
 * @extends Component
 */
export class SizeChartComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    console.log('[Size Chart] Component connected:', this.id);
    console.log('[Size Chart] Dialog component found:', !!this.dialogComponent);
  }

  /**
   * Gets the dialog component element.
   *
   * @returns {import('./dialog.js').DialogComponent | null} The dialog component.
   */
  get dialogComponent() {
    return this.querySelector('dialog-component');
  }

  /**
   * Opens the size chart modal.
   *
   * Delegates to the nested dialog-component's showDialog method.
   */
  openModal() {
    console.log('[Size Chart] openModal called on:', this.id);
    const dialog = this.dialogComponent;

    if (!dialog) {
      console.error('[Size Chart] dialog-component not found inside:', this.id);
      console.log('[Size Chart] Component HTML:', this.innerHTML.substring(0, 200));
      return;
    }

    console.log('[Size Chart] Dialog component found:', dialog);
    console.log('[Size Chart] showDialog method exists:', typeof dialog.showDialog);

    if (typeof dialog.showDialog === 'function') {
      console.log('[Size Chart] Calling showDialog...');
      dialog.showDialog();
      console.log('[Size Chart] showDialog called successfully');
    } else {
      console.error('[Size Chart] showDialog method not found on dialog-component');
      console.log('[Size Chart] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(dialog)));
    }
  }

  /**
   * Closes the size chart modal.
   *
   * Delegates to the nested dialog-component's closeDialog method.
   */
  closeModal() {
    const dialog = this.dialogComponent;

    if (!dialog) {
      console.error('Size chart: dialog-component not found');
      return;
    }

    if (typeof dialog.closeDialog === 'function') {
      dialog.closeDialog();
    } else {
      console.error('Size chart: closeDialog method not found on dialog-component');
    }
  }

  /**
   * Toggles the size chart modal open/closed.
   *
   * Delegates to the nested dialog-component's toggleDialog method.
   */
  toggleModal() {
    const dialog = this.dialogComponent;

    if (!dialog) {
      console.error('Size chart: dialog-component not found');
      return;
    }

    if (typeof dialog.toggleDialog === 'function') {
      dialog.toggleDialog();
    } else {
      console.error('Size chart: toggleDialog method not found on dialog-component');
    }
  }
}

if (!customElements.get('size-chart-component')) {
  customElements.define('size-chart-component', SizeChartComponent);
  console.log('[Size Chart] Custom element registered: size-chart-component');
} else {
  console.warn('[Size Chart] Custom element already registered: size-chart-component');
}

// Debug: Log all size chart components on page load
document.addEventListener('DOMContentLoaded', () => {
  const sizeChartComponents = document.querySelectorAll('size-chart-component');
  console.log('[Size Chart] Found', sizeChartComponents.length, 'size chart component(s) on page');
  sizeChartComponents.forEach((comp, index) => {
    console.log(`[Size Chart] Component ${index + 1}:`, comp.id);
  });
});
