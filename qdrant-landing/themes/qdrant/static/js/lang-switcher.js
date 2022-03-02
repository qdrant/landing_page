(function () {

  class LangSwitcher {
    constructor(tabs, index) {
      this.tabs = tabs || [];
      this.index = index || 0;
      this.langButtons = null;
    }

    /**
     * creates tabs with languages names in the interface
     */
    initLangButtons() {
      // create an element
      this.langButtons = document.createElement('section');
      this.langButtons.classList.add('lang-tabs')
      // for each tab
      this.tabs.forEach((tab, i) => {
        // - getLang
        const lang = this.getLang(tab);
        let lTab = document.createElement('span');
        lTab.classList.add('lang-tabs__button');
        (i == 0) && lTab.classList.add('active');
        lTab.dataset.lang = lang;
        lTab.innerText = lang;
        // - append new el into element
        this.langButtons.append(lTab);
      });
      this.tabs[0].before(this.langButtons);
    }

    changeLanguage(lang) {
      const activeHlt = this.tabs.find(t => {
        return t.querySelectorAll(`code.language-${lang}`).length > 0
      })

      this.tabs.forEach(t => t.style.display = 'none');
      activeHlt.style.display = 'block';
      this.#setActiveButton(lang);
    }

    setTabs(tabs) {
      tabs[0].active = true;
      this.tabs = tabs;
    }

    getLang(tab) {
      return tab.getElementsByTagName('code')[0].dataset.lang;
    }

    getLangButtons() {
      return this.langButtons;
    }

    #setActiveButton(lang) {
      this.langButtons.querySelector('.active').classList.remove('active');
      this.langButtons.querySelector(`[data-lang=${lang}]`).classList.add('active');
    }
  }

  const allHighlights = document.getElementsByClassName('highlight')
  let highlightsGroups = [];
  let groupArr = [];
  /*
  1. go through all highlights */
  for (let hl of allHighlights) {
    let isFirstInGroup = !hl.previousElementSibling.classList.contains('highlight');
    let isLastInGroup = !hl.nextElementSibling.classList.contains('highlight');

    if (isFirstInGroup) {
      groupArr = [];
    }

    if (isLastInGroup) {
      if (groupArr.length > 0) {
        highlightsGroups.push(groupArr);
      }
    }

    groupArr.push(hl);
  }

  /*
  2. init switcher for each new arr
   */
  highlightsGroups.forEach((g, i) => {
    const langSwitcher = new LangSwitcher(g);
    langSwitcher.initLangButtons();

    langSwitcher.getLangButtons().addEventListener("click", (e) => {
      langSwitcher.changeLanguage(e.target.dataset.lang);
    })
  })
}).call(this);
