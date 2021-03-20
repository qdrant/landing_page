(function($) {

  /**
   * Copyright 2012, Digital Fusion
   * Licensed under the MIT license.
   * http://teamdf.com/jquery-plugins/license/
   *
   * @author Sam Sehnert
   * @desc A small plugin that checks whether elements are within
   *     the user visible viewport of a web browser.
   *     only accounts for vertical position, not horizontal.
   */

  $.fn.visible = function(partial) {
    
      var $t            = $(this),
          $w            = $(window),
          viewTop       = $w.scrollTop(),
          viewBottom    = viewTop + $w.height(),
          _top          = $t.offset().top,
          _bottom       = _top + $t.height(),
          compareTop    = partial === true ? _bottom : _top,
          compareBottom = partial === true ? _top : _bottom;
    
    return ((compareBottom <= viewBottom) && (compareTop >= viewTop));

  };
    
})(jQuery);

$(window).on('scroll', function() {
  
  $(".banner-section-two .layers-box .layer-one,.banner-section-two .layers-box .layer-two,.banner-section-two .layers-box .layer-three,.main-footer .left-layer,.main-footer .left-layer-2,.main-footer .left-layer-3, #testimonials-slider-pager a.pager-item.icon-one,#testimonials-slider-pager a.pager-item.icon-two,#testimonials-slider-pager a.pager-item.icon-three,#testimonials-slider-pager a.pager-item.icon-four,#testimonials-slider-pager a.pager-item.icon-five,#testimonials-slider-pager a.pager-item.icon-six, #testimonials-slider-pager a.pager-item.icon-one").each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      el.addClass("now-in-view"); 
    } else {
      el.removeClass("now-in-view");
    }
  });
  
});

$(document).on('ready', function() {
  $(".banner-section-two .layers-box .layer-one,.banner-section-two .layers-box .layer-two,.banner-section-two .layers-box .layer-three,.main-footer .left-layer,.main-footer .left-layer-2,.main-footer .left-layer-3, #testimonials-slider-pager a.pager-item.icon-one,#testimonials-slider-pager a.pager-item.icon-two,#testimonials-slider-pager a.pager-item.icon-three,#testimonials-slider-pager a.pager-item.icon-four,#testimonials-slider-pager a.pager-item.icon-five,#testimonials-slider-pager a.pager-item.icon-six, #testimonials-slider-pager a.pager-item.icon-one").each(function(i, el) {
	var el = $(el);
	if (el.visible(true)) {
	  el.addClass("now-in-view"); 
	} else {
	  el.removeClass("now-in-view");
	}
  });
});