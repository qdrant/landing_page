/**
 * Fillable prompt templates (/documentation/agentic-tools/prompt-templates/).
 *
 * The shortcode renders the prompt body server-side with its {{PLACEHOLDER}}
 * tokens intact. This module takes that text as its source, substitutes the
 * values you type, and marks whatever is still unresolved. Nothing is fetched,
 * and nothing is stored.
 *
 * Blocks separated by a blank line are the unit of resolution. When every
 * placeholder in a block belongs to an empty optional variable, the whole block
 * is dropped rather than handed to an agent as a literal token. Template
 * authors should therefore keep one variable per blank-line-separated block; a
 * block mixing a filled required variable with an empty optional one is kept,
 * and the optional token stays visible.
 */
(function () {
  const PLACEHOLDER_SRC = '\\{\\{\\s*([A-Z0-9_]+)\\s*\\}\\}';

  // A fresh regex per use: a shared global one carries lastIndex between calls.
  const placeholders = () => new RegExp(PLACEHOLDER_SRC, 'g');

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
      this.copyLabel = this.copyBtn ? this.copyBtn.textContent : 'Copy';
      this.copyTimer = null;

      this.inputs.forEach((input) => {
        input.addEventListener('input', () => this.render());
      });

      if (this.copyBtn) {
        this.copyBtn.addEventListener('click', () => this.copy());
      }

      // Reveals the copy button, which is hidden until the behavior exists.
      root.classList.add('prompt-template--ready');
      this.render();
    }

    values() {
      return this.inputs.reduce((acc, input) => {
        acc[input.dataset.ptVar] = input.value.trim();
        return acc;
      }, {});
    }

    /** Optional variables left empty: their blocks come out of the prompt. */
    droppable(values) {
      return new Set(
        this.inputs
          .filter((input) => input.dataset.ptRequired !== 'true')
          .map((input) => input.dataset.ptVar)
          .filter((name) => !values[name]),
      );
    }

    resolve() {
      const values = this.values();
      const droppable = this.droppable(values);

      return this.source
        .split(/\n{2,}/)
        .filter((block) => {
          const names = Array.from(block.matchAll(placeholders()), (m) => m[1]);
          return !(names.length > 0 && names.every((name) => droppable.has(name)));
        })
        .join('\n\n')
        .replace(placeholders(), (token, name) => values[name] || token);
    }

    missingRequired() {
      const values = this.values();
      return this.inputs
        .filter((input) => input.dataset.ptRequired === 'true' && !values[input.dataset.ptVar])
        .map((input) => input.dataset.ptVar);
    }

    render() {
      this.output.innerHTML = escapeHtml(this.resolve()).replace(
        placeholders(),
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

    flashCopyLabel(text, isError) {
      clearTimeout(this.copyTimer);
      this.copyBtn.textContent = text;
      this.copyBtn.classList.toggle('prompt-template__copy--done', !isError);

      this.copyTimer = setTimeout(() => {
        this.copyBtn.textContent = this.copyLabel;
        this.copyBtn.classList.remove('prompt-template__copy--done');
      }, 1600);
    }

    copy() {
      navigator.clipboard.writeText(this.resolve()).then(
        () => this.flashCopyLabel('Copied', false),
        () => this.flashCopyLabel('Copy failed', true),
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
