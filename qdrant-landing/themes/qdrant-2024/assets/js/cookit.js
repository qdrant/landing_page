import { getCookie, setCookie } from './helpers';
import { handleConsent } from '../ts/segment-helpers';

(function () {
  window.cookit = function (options) {
    // SETTINGS
    var settings = Object.assign(
      {
        backgroundColor: '#1c1c1c',
        messageColor: '#fff',
        linkColor: '#fad04c',
        buttonColor: '#fad04c',
        messageText: '<b>Do you hungry ?</b> 🍪 Pursuing navigation on this site, you accept the use of cookies.',
        linkText: 'Learn more',
        linkUrl: 'https://www.cookiesandyou.com',
        buttonText: 'I accept',
        lifetime: 365,
      },
      options,
    );

    // DOM ITEMS
    const body = document.body;
    const banner = document.createElement('div');
    banner.id = 'cookit';
    const container = document.createElement('div');
    container.id = 'cookit-container';
    const message = document.createElement('p');
    message.id = 'cookit-message';
    message.innerHTML = settings.messageText;
    const link = document.createElement('a');
    link.id = 'cookit-link';
    link.href = settings.linkUrl;
    link.target = '_blank';
    link.textContent = settings.linkText;
    const button = document.createElement('a');
    button.id = 'cookit-button';
    button.href = '#';
    button.textContent = settings.buttonText;

    // CHECK IF COOKIE ALREADY EXISTS
    if (!getCookie('cookie-consent')) {
      init();
    }

    // INITIALISATION
    function init() {
      body.appendChild(banner);
      banner.appendChild(container);
      banner.style.backgroundColor = settings.backgroundColor;
      container.appendChild(message);
      message.style.color = settings.messageColor;
      container.appendChild(link);
      link.style.color = settings.linkColor;
      container.appendChild(button);
      button.style.backgroundColor = settings.buttonColor;
      button.style.color = settings.backgroundColor;
    }

    // EVENT LISTENER (click)
    button.addEventListener('click', () => {
      if (window.analytics) {
        handleConsent();
      }

      banner.remove();
      setCookie('cookie-consent', 1, settings.lifetime);
    });
  };
})();
