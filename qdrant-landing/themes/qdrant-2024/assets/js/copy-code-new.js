(function () {
  const initCopyCode = (root = document) => {
    root.querySelectorAll(".js-copy-code").forEach((wrap) => {
      const btnCopy = wrap.querySelector(".js-copy-code__copy");
      const btnDone = wrap.querySelector(".js-copy-code__done");
      const codeEl = wrap.querySelector(".highlight code");

      if (!btnCopy || !btnDone || !codeEl) return;

      btnCopy.type = "button";
      btnDone.type = "button";

      const copyDisplay = getComputedStyle(btnCopy).display === "none" ? "inline-flex" : getComputedStyle(btnCopy).display;
      const doneDisplay = getComputedStyle(btnDone).display === "none" ? copyDisplay : getComputedStyle(btnDone).display;

      btnDone.style.display = "none";

      btnCopy.addEventListener("click", async () => {
        const text = codeEl.textContent || "";

        try {
          await navigator.clipboard.writeText(text);

          btnCopy.style.display = "none";
          btnDone.style.display = doneDisplay;

          setTimeout(() => {
            btnDone.style.display = "none";
            btnCopy.style.display = copyDisplay;
          }, 1200);
        } catch (e) {
          console.error(e);
        }
      });
    });
  };

  initCopyCode(document);
})();