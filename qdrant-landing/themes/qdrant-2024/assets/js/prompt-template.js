/**
 * Fillable prompt templates (/documentation/agentic-tools/prompt-templates/).
 *
 * The shortcode renders the prompt body server-side with its {{PLACEHOLDER}}
 * tokens intact. This module takes that text as its source, substitutes the
 * values you type, and marks whatever is still unresolved. Nothing is fetched,
 * and nothing is stored.
 */
(function () {
  const PLACEHOLDER = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

  const escapeHtml = (value) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  class PromptTemplate {
    constructor(root) {
      this.root = root;
      this.output = root.querySelector('[data-pt-output]');

      if (!this.output) return;

      // The server-rendered body is the source of truth, read once before any
      // substitution happens.
      this.source = this.output.textContent;
      this.inputs = Array.from(root.querySelectorAll('[data-pt-var]'));
      this.status = root.querySelector('[data-pt-status]');
      this.copyBtn = root.querySelector('[data-pt-copy]');

      this.inputs.forEach((input) => {
        input.addEventListener('input', () => this.render());
      });

      if (this.copyBtn) {
        this.copyBtn.addEventListener('click', () => this.copy());
      }

      this.render();
    }

    values() {
      return this.inputs.reduce((acc, input) => {
        acc[input.dataset.ptVar] = input.value.trim();
        return acc;
      }, {});
    }

    resolve() {
      const values = this.values();
      return this.source.replace(PLACEHOLDER, (token, name) => values[name] || token);
    }

    missingRequired() {
      const values = this.values();
      return this.inputs
        .filter((input) => input.dataset.ptRequired === 'true' && !values[input.dataset.ptVar])
        .map((input) => input.dataset.ptVar);
    }

    render() {
      this.output.innerHTML = escapeHtml(this.resolve()).replace(
        PLACEHOLDER,
        '<span class="prompt-template__ph">$&</span>',
      );

      this.inputs.forEach((input) => {
        const field = this.root.querySelector(`[data-pt-field="${input.dataset.ptVar}"]`);
        if (field) field.classList.toggle('prompt-template__field--filled', !!input.value.trim());
      });

      if (!this.status) return;

      const missing = this.missingRequired();

      if (missing.length === 0) {
        this.status.textContent = 'All required variables resolved.';
        this.status.classList.add('prompt-template__status--ready');
      } else {
        this.status.textContent = `Still unresolved: ${missing.join(', ')}`;
        this.status.classList.remove('prompt-template__status--ready');
      }
    }

    copy() {
      const label = this.copyBtn.textContent;

      navigator.clipboard.writeText(this.resolve()).then(
        () => {
          this.copyBtn.textContent = 'Copied';
          this.copyBtn.classList.add('prompt-template__copy--done');

          setTimeout(() => {
            this.copyBtn.textContent = label;
            this.copyBtn.classList.remove('prompt-template__copy--done');
          }, 1600);
        },
        () => {
          this.copyBtn.textContent = 'Press Ctrl+C';
        },
      );
    }
  }

  const init = () => {
    document.querySelectorAll('[data-prompt-template]').forEach((root) => {
      new PromptTemplate(root);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
