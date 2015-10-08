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
            '<dt><a href="#">' + $selected.text() + '<span class="caret"></span>' +
            '<span class="value">' + $selected.val() +
            '</span></a></dt>'
          )
          .append('<dd><ul class="content"></ul></dd>');

        var $dropdown_content = $dropdown.find('.content');

        $options.each(function(){
          $dropdown_content.append('<li><a href="#">' +
            $(this).text() + '<span class="value">' +
            $(this).val() + '</span></a></li>');
        });

        $source.hide().after($dropdown);

        self.attachEvents($dropdown, $source);
      });

    },

    attachGlobalEvents: function() {

      $(document).off('click.' + pluginName)
        .on('click.' + pluginName, function(e) {

          var $clicked = $(e.target);
          var $dropdown = $clicked.closest('.dropdown');

          // hide options from any dropdown not being clicked
          $('.dropdown').not($dropdown).find('dd ul').hide();
      });
    },

    attachEvents: function($dropdown, $source) {

      $dropdown.on('click', 'dt a', function(event) {
        event.preventDefault();
        $dropdown.find("dd ul").toggle();

      });

      $dropdown.on('click', 'dd ul li a', function(event) {
        event.preventDefault();
        selectOption($(this));
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
        $li.parent().find('> .focused').removeClass('focused');
        $li.addClass('focused');

        $dropdown.find("dt a").html(text);

        if (hide) {
          $dropdown.find("dd ul").hide();
        } else {
          scrollToElement($li);
        }

        var new_val = $element.find("span.value").html();
        $source.val(new_val).trigger('change');
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
      $dropdown.on('keyup', function(key) {

        if (key.keyCode !== 0 && key.keyCode !== 13) {
          var char = String.fromCharCode(key.keyCode);
          var $focused = $dropdown.find(".content li.focused");

          var next_anchors = [];
          if ($focused.length) {
            next_anchors = $dropdown.find(".content li.focused").nextAll();
          }

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
            selectOption(found_option.find('a'), false);
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