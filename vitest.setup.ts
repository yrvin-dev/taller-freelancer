import '@testing-library/jest-dom/vitest';

// jsdom no implementa <dialog>.showModal()/close(). Polyfill mínimo: solo el atributo
// `open` y el evento `close`. El foco atrapado y el fondo inerte se prueban en e2e.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
