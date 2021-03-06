/**
 * @author Nicolás Bottini <nicobot|nicolasbottini@gmail.com>
 */
;(function ( $, window, document, undefined ) {

  "use strict";

  // Create the defaults once
  var pluginName = "selectBox",
    defaults = {
      orientation: "left"
    };

  // The actual plugin constructor
  function Plugin ( element, options ) {
    this.element = element;

    this.settings = $.extend( {}, defaults, options );
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  // Avoid Plugin.prototype conflicts
  $.extend(Plugin.prototype, {
    init: function () {

      this.attachGlobalEvents();
      this.createDropDown($(this.element));

    },

    createDropDown: function($context) {

      var self = this;
      $context = $context || document;
      var $target = $context;

      if (!$context.is('select:not(.selectbox-processed)')) {
        $target = $('select:not(.selectbox-processed)', $context);
      }

      $target.addClass('selectbox-processed').each(function(){
        var $source = $(this);
        var $selected = $source.find("option[selected]");
        var $options = $("option", $source);

        var $dropdown = $('<dl class="dropdown custom" tabindex="0"></dl>');

        $dropdown.addClass('orientation-' + self.settings.orientation);

        if ($selected.length == 0) {
          $selected = $source.find("option:first");
        }

        $dropdown
          .append(
            '<dt><a href="#" tabindex="-1">' + $selected.text() + '<span class="caret"></span>' +
            '<span class="value">' + $selected.val() +
            '</span></a></dt>'
          )
          .append('<dd><ul class="content"></ul></dd>');

        var $dropdown_content = $dropdown.find('.content');


        $options.each(function(){
          var $option = $('<li><a href="#">' +
            $(this).text() + '<span class="value">' +
            $(this).val() + '</span></a></li>');

          if ($(this).val() == $selected.val()) {
            $option.addClass('focused');
          }

          $dropdown_content.append($option);
        });

        $source.hide().after($dropdown);

        self.attachEvents($dropdown, $source);

        $dropdown.find('.focused a').trigger('select');
      });

    },

    closeDropdowns: function($dropdowns) {
      $dropdowns.find('dd ul').hide();
      $dropdowns.find('li.hover').removeClass('hover');
    },

    attachGlobalEvents: function() {

      var self = this;

      $(document).off('click.' + pluginName)
        .on('click.' + pluginName, function(e) {

          var $clicked = $(e.target);
          var $dropdown = $clicked.closest('.dropdown');

          // hide options from any dropdown not being clicked
          var $dropdowns = $('.dropdown').not($dropdown);

          self.closeDropdowns($dropdowns);
        });
    },

    attachEvents: function($dropdown, $source) {

      var self = this;

      $dropdown.on('click', 'dt a', function(event) {
        event.preventDefault();
        $dropdown.find("dd ul").toggle();
      });

      $dropdown.on('click select', 'dd ul li a', function(event) {
        event.preventDefault();
        selectOption($(this));
      });

      $dropdown.on('mouseenter', 'dd li', function(event) {
        $dropdown.find("li.hover").removeClass('hover');
        $(event.target).parent().addClass('hover');
      });

      /**
       * Selects an option
       * @param $element
       */
      var selectOption = function($element, hide) {

        var text = $element.html() + '<span class="caret"></span>';

        if (hide === undefined) {
          hide = true;
        }

        var $li = $element.parent();
        $li.parent().find('> .focused, > .hover').removeClass('focused').removeClass('hover');
        $li.addClass('focused');

        $dropdown.find("dt a").html(text);

        if (hide) {
          $dropdown.find("dd ul").hide();
        } else {
          scrollToElement($li);
        }

        var new_val = $element.find("span.value").html();

        if ($source.val() != new_val) {
          $source.val(new_val).trigger('change');
        }
      };

      /**
       * Makes hover on an option
       * @param $element
       */
      var hoverOption = function($element) {

        var $li = $element.parent();
        $li.parent().find('> .hover').removeClass('hover');
        $li.addClass('hover');
        scrollToElement($li);

      };

      /**
       * Scrolls the container to an specific element
       * @param $element
       */
      var scrollToElement = function($element) {
        var $container = $element.parent();

        var vertical_padding = parseInt($container.css('padding-top')) + parseInt($container.css('padding-bottom'));
        var container_info = {
          height: $container.height() + vertical_padding,
          scrollTop: $container.scrollTop(),
          top: $container.offset().top
        };

        var element_info = {
          top: $element.offset().top - container_info.top,
          height: $element.height(),
          pos_top: $element.position().top
        };

        if (element_info.pos_top > 0 && element_info.pos_top + element_info.height <= container_info.height) {
          // Element visible
        } else {
          if (element_info.top <= $container.top) {
            // element is BEFORE the container window
            $container.scrollTop(container_info.scrollTop - element_info.top);
          } else {
            // element is AFTER the container window
            $container.scrollTop(container_info.scrollTop + element_info.top - container_info.height + element_info.height);
          }
        }

      };

      // Catch keypressed keys to navigate between options
      $dropdown.on('keydown', function(event) {

        var code = event.keyCode;

        if (code !== 0) {
          if ($dropdown.find(".content li").length == 0) {
            return;
          }

          if (code == 38 || code == 40) {
            event.preventDefault();

            if (!$dropdown.find("dd ul").is(':visible'))  {
              $dropdown.find("dd ul").toggle();
              return;
            }
          }

          if (code == 27 && $dropdown.find("dd ul").is(':visible')) {
            self.closeDropdowns($dropdown);
            return;
          }

          var $hover = $dropdown.find(".content li.hover");

          if ($hover.length == 0) {
            var $hover = $dropdown.find(".content li.focused");
            if ($hover.length == 0) {
              var $hover = $dropdown.find(".content li:first");
            }
          }

          switch (code) {
            case 38:
              // UP
              var $li;

              $li = $hover.prev();
              if ($li.length == 0) {
                $li = $dropdown.find(".content li:last");
              }

              if ($li.length) {
                hoverOption($li.find('a'));
              }

              break;

            case 40:
              // DOWN:
              var $li;

              $li = $hover.next();
              if ($li.length == 0) {
                $li = $dropdown.find(".content li:first");
              }

              if ($li.length) {
                hoverOption($li.find('a'));
              }

              break;

            case 13:
              // ENTER
              selectOption($hover.find('a'));

              break;

            default:
              var char = String.fromCharCode(code);

              var next_anchors = [];
              next_anchors = $hover.nextAll();

              var all_anchors = $dropdown.find(".content li");
              all_anchors = all_anchors.not(next_anchors);
              $.merge(next_anchors, all_anchors);

              var found_option = false;
              $(next_anchors).each(function() {
                var $this = $(this);
                if ($this.text()[0].toLowerCase() == char.toLowerCase()) {
                  found_option = $this;
                  return false;
                }
              });

              if (found_option) {
                hoverOption(found_option.find('a'));
              }
          }

        }
      });
    }
  });

  $.fn[ pluginName ] = function ( options ) {
    return this.each(function() {
      if ( !$.data( this, "plugin_" + pluginName ) ) {
        $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
      }
    });
  };

})( jQuery, window, document );