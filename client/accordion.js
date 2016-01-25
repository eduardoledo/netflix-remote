// function accordion() {
//   $('.accordion .toggle').click(function(e) {
//     e.preventDefault();
//
//     var $this = $(this);
//
//     if ($this.next().hasClass('show')) {
//       $this.next().removeClass('show');
//       $this.next().slideUp(350);
//     } else {
//       $this.parent().parent().find('li .inner').removeClass('show');
//       $this.parent().parent().find('li .inner').slideUp(350);
//       $this.next().toggleClass('show');
//       $this.next().slideToggle(350);
//     }
//   });
// }

(function($) {
  $.fn.nestedAccordion = function(options) {
    var settings = $.extend($.fn.nestedAccordion.defaults, options);

    return this;
  }

  $.fn.nestedAccordion.defaults = {
    // selectors, styles, etc.
  }

  $.fn.nestedAccordion.toggleNode = function(node) {}
}(jQuery));
