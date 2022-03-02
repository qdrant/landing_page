(function () {
  /**
   * @class LangSwitcher
   * create tabs with buttons to switching
   * between languages variants,
   * works with highlights.js
   */
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
      // create a wrapper element
      this.langButtons = document.createElement('section');
      this.langButtons.classList.add('lang-tabs');
      // adds a button for each tab
      this.tabs.forEach((tab, i) => {
        const lang = this.getLang(tab);
        let button = document.createElement('span');
        button.classList.add('lang-tabs__button');
        (i == 0) && button.classList.add('active');
        button.dataset.lang = lang;
        button.innerText = lang;
        // append new button into wrapper element
        this.langButtons.append(button);
      });
      this.tabs[0].before(this.langButtons);
    }

    switchLanguage(lang) {
      const activeTab = this.tabs.find(t => {
        return t.querySelectorAll(`code.language-${lang}`).length > 0
      })

      this.tabs.forEach(t => t.style.display = 'none');
      activeTab.style.display = 'block';
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

    // should be used together with changing of the active tab visibility
    #setActiveButton(lang) {
      this.langButtons.querySelector('.active').classList.remove('active');
      this.langButtons.querySelector(`[data-lang=${lang}]`).classList.add('active');
    }
  }

  const allTabs = document.getElementsByClassName('highlight')
  let tabsGroups = [];
  let groupArr = [];

  /**
   * go through all tabs (elements with class .highlight)
   */
  for (let hl of allTabs) {
    groupArr.push(hl);

    let isLastInGroup = !hl.nextElementSibling?.classList?.contains('highlight');

    if(isLastInGroup) {
      tabsGroups.push(groupArr);
      groupArr = [];
    }
  }

  /**
   * init switcher for each group of tabs
   */
  tabsGroups.forEach((g, i) => {
    const langSwitcher = new LangSwitcher(g);
    langSwitcher.initLangButtons();

    langSwitcher.getLangButtons().addEventListener("click", (e) => {
      langSwitcher.switchLanguage(e.target.dataset.lang);
    })
  })
}).call(this);
