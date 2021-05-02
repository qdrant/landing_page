(function($) {
  $.cookit = function(options) {

    // 🎛️ SETTINGS
    var settings = $.extend({
      backgroundColor: '#1c1c1c',
      messageColor: '#fff',
      linkColor: '#fad04c',
      buttonColor: '#fad04c',
      messageText: "<b>Do you hungry ?</b> 🍪 Pursuing navigation on this site, you accept the use of cookies.",
      linkText: "Learn more",
      linkUrl: "https://www.cookiesandyou.com",
      buttonText: "I accept",
      lifetime: 365
    }, options);
    
    // 🎯 DOM ITEMS
    const body = $("body");
    const banner = $("<div id='cookit'></div>");
    const container = $("<div id='cookit-container'></div>");
    const message = $("<p id='cookit-message'>"+ settings.messageText +"</p>");
    const link = $("<a id='cookit-link' href='" + settings.linkUrl + "' target='_blank'>" + settings.linkText + "</a>");
    const button = $("<a id='cookit-button' href='#'>" + settings.buttonText + "</a>");

    // ✔️ CHECK IF COOKIE ALREADY EXISTS
    if (!getCookie('cookie-consent')) { init(); }

    // ▶️ INITIALISATION
    function init() {
      body.append(banner);
      banner.append(container).css({'background-color': settings.backgroundColor});
      container.append(message.css({'color': settings.messageColor})).append(link.css({'color': settings.linkColor})).append(button.css({'background-color': settings.buttonColor,'color': settings.backgroundColor}));
    }

    // 👀 EVENT LISTENER (click)
    button.on('click', () => {
      banner.remove();
      setCookie('cookie-consent', 1, settings.lifetime);
    });
    
    // ⚙️ GET COOKIE
    function getCookie(name) {
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      name = name + "=";
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
    }
    
    // ⚙️ SET COOKIE
    function setCookie(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      const expires = "expires=" + date.toUTCString();
      document.cookie = name + "=" + value + ";" + expires + ";path=/;Secure";
    }

  };
})(jQuery);