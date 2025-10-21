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
  /**
   * Gets the dialog component element.
   *
   * @returns {import('./dialog.js').DialogComponent | null} The dialog component.
   */
  get dialogComponent() {
    return this.querySelector('dialog-component');
  }

  /**
   * Opens the size chart modal with smooth animation.
   *
   * Delegates to the nested dialog-component's showDialog method.
   */
  openModal() {
    const dialog = this.dialogComponent;

    if (!dialog) {
      console.error('Size chart: dialog-component not found');
      return;
    }

    if (typeof dialog.showDialog === 'function') {
      const dialogElement = dialog.querySelector('dialog');

      // Open the dialog
      dialog.showDialog();

      // Trigger animation on next frame
      if (dialogElement) {
        requestAnimationFrame(() => {
          dialogElement.classList.add('dialog-opening');
        });
      }
    } else {
      console.error('Size chart: showDialog method not found on dialog-component');
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
      const dialogElement = dialog.querySelector('dialog');

      // Remove opening class before close animation starts
      if (dialogElement) {
        dialogElement.classList.remove('dialog-opening');
      }

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
}
