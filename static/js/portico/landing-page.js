import fuzzysearch from 'fuzzysearch';

// this will either smooth scroll to an anchor where the `name`
// is the same as the `scroll-to` reference, or to a px height
// (as specified like `scroll-to='0px'`).
var ScrollTo = function () {
    $("[scroll-to]").click(function () {
        var sel = $(this).attr("scroll-to");

        // if the `scroll-to` is a parse-able pixel value like `50px`,
        // then use that as the scrollTop, else assume it is a selector name
        // and find the `offsetTop`.
        var top = /\dpx/.test(sel) ?
                parseInt(sel, 10) :
                $("[name='" + sel + "']").offset().top;

        $("body").animate({ scrollTop: top + "px" }, 300);
    });
};

var detectPath = function (pathname) {
    var match = (pathname || window.location.pathname).match(/(\/\w+)?\/(.+)\//);
    if (match !== null) {
        return match[2];
    }
};

// these are events that are only to run on the integrations page.
// check if the page location is integrations.
var integration_events = function () {
    var integrations = $('.integration-lozenges').children().toArray();
    var scroll_top = 0;

    $("a.title")
        .addClass("show-integral")
        .prepend($("<span class='integral'>∫</span>"))
        .hover(function () {
            $(".integral").css("display", "inline");
            var width = $(".integral").width();
            $("a.title").css("left", -1 * width);
        },
        function () {
            $(".integral").css("display", "none");
                $("a.title").css("left", 0);
            }
        );

    var $lozenge_icon;
    var currentblock;
    var instructionbox = $("#integration-instruction-block");
    var hashes = $('.integration-instructions').map(function () {
        return this.id || null;
    }).get();


    var show_integration = function (hash) {
        // the version of the hash without the leading "#".
        var _hash = hash.replace(/^#/, "");

        // clear out the integrations instructions that may exist in the instruction
        // block from a previous hash.
        $("#integration-instruction-block .integration-instructions")
            .appendTo("#integration-instructions-group");

        if (hashes.indexOf(_hash) > -1) {
            $lozenge_icon = $(".integration-lozenges .integration-lozenge.integration-" + _hash).clone(true);
            currentblock = $(hash);
            instructionbox.hide().children(".integration-lozenge").replaceWith($lozenge_icon);
            instructionbox.append($lozenge_icon);

            $(".inner-content").removeClass("show");
            setTimeout(function () {
                instructionbox.hide();
                $(".integration-categories-dropdown").css('display', 'none');
                $(".integrations .catalog").addClass('hide');
                $(".extra, #integration-main-text, #integration-search").css("display", "none");

                instructionbox.append(currentblock);
                instructionbox.show();
                $("#integration-list-link").css("display", "block");

                $(".inner-content").addClass("show");
            }, 300);

            $("html, body").animate({ scrollTop: 0 }, 200);
        }
    };

    function update_hash() {
        var hash = window.location.hash;

        if (hash && hash !== '#' && hash !== '#hubot-integrations') {
            scroll_top = $("body").scrollTop();
            show_integration(window.location.hash);
        } else if (currentblock && $lozenge_icon) {
            $(".inner-content").removeClass("show");
            setTimeout(function () {
                $("#integration-list-link").css("display", "none");
                $(".extra, #integration-main-text, #integration-search").show();
                instructionbox.hide();
                $lozenge_icon.remove();
                currentblock.appendTo("#integration-instructions-group");

                $(".inner-content").addClass("show");
                $(".integration-categories-dropdown").css('display', '');
                $(".integrations .catalog").removeClass('hide');

                $('html, body').animate({ scrollTop: scroll_top }, 0);
            }, 300);
        } else {
            $(".inner-content").addClass("show");
            $(".integration-categories-dropdown").removeClass('hide');
            $(".integrations .catalog").removeClass('hide');
        }
    }

    window.onhashchange = update_hash;
    update_hash();

    // this needs to happen because when you link to "#" it will scroll to the
    // top of the page.
    $("#integration-list-link").click(function (e) {
        var scroll_height = $("body").scrollTop();
        window.location.hash = "#";
        $("body").scrollTop(scroll_height);

        e.preventDefault();
    });

    $('#integration-search input[type="text"]').keypress(function (e) {
        if (e.which === 13 && e.target.value !== '') {
            for (var i = 0; i < integrations.length; i += 1) {
                var integration = $(integrations[i]).find('.integration-lozenge');

                if ($(integration).css('display') !== 'none') {
                    $(integration).closest('a')[0].click();
                    break;
                }
            }
        }
    });

    $(window).scroll(function () {
         if (document.body.scrollTop > 330) {
             $('.integration-categories-sidebar').addClass('sticky');
         } else {
             $('.integration-categories-sidebar').removeClass('sticky');
        }
    });
};


function integration_search() {
    var integrations = $('.integration-lozenges').children().toArray();
    var current_category = 'All';
    var current_query = '';

    function update_categories() {
        $('.integration-category').removeClass('selected');
        $('[data-category="' + current_category + '"]').addClass('selected');
    }

    var update_integrations = _.debounce(function () {
        integrations.forEach(function (integration) {
            var $integration = $(integration).find('.integration-lozenge');

            var display =
                fuzzysearch(current_query, $integration.data('name').toLowerCase()) &&
                ($integration.data('categories').indexOf(current_category) !== -1 ||
                 current_category === 'All');

            if (display) {
                $integration.css('display', 'inline-block');
            } else {
                $integration.css('display', 'none');
            }
        });
    }, 50);

    function change_category(category) {
        $('.integration-lozenges').css('opacity', 0);

        current_category = category;
        update_categories();
        update_integrations();

        $('.integration-lozenges').animate(
            { opacity: 1 },
            { duration: 400 }
        );
    }

    function run_search(query) {
        current_query = query.toLowerCase();
        update_integrations();
    }

    $('.integrations .integration-category').on('click', function (e) {
        var category = $(e.target).data('category');

        if (category !== current_category) {
            change_category(category);
        }
    });

    $(".integrations .searchbar input[type='text']").on('input', function (e) {
        run_search(e.target.value);
    });
}


var hello_events = function () {
    var counter = 0;
    $(window).scroll(function () {
        if (counter % 2 === 0) {
            $(".screen.hero-screen .message-feed").css("transform", "translateY(-" + $(this).scrollTop() / 5 + "px)");
        }
        counter += 1;
    });

    $(".footer").addClass("hello");
};


var pricing_events = function () {
    $(window).scroll(function () {
        if ($(document.activeElement).is(".price-box")) {
            document.activeElement.blur();
        }
    });

    var $pricing_overlay = $(".pricing-overlay");
    var $inline_overlay = $(".pricing-model:not(.pricing-overlay)");
    // var $pricing_container = $(".pricing-overlay .pricing-container");
    var $info_box = $(".info-box");

    // var $original;
    var $clone;
    var height;

    var calculate_position = {
        initial: function (top, left) {
            return ["transform", "translateX(" + (left - 50) + "px) translateY(" + (top - 50) + "px)"];
        },
        final: function (height) {
            return ["transform", "translateX(0px) translateY(" + (window.innerHeight - 100 - height) / 2 + "px)"];
        },
    };

    var reset = function () {
        $info_box.removeClass("show").css("transform", "translateY(300px)");
        $pricing_overlay.removeClass("active");
        $inline_overlay.removeClass("stick");
        if ($clone) {
            setTimeout(function () {
                $clone.remove();
            }, 300);
        }
    };

    /*
    $("body").on("focus", ".price-box", function (e) {
        $original = $(e.target);
        var offset = $original.offset();
        height = $original.height();

        var top = offset.top - $("body").scrollTop() + 2;
        var left = offset.left + 2;

        if ($clone) {
            $clone.remove();
        }

        $clone = $original.blur().clone(true);
        // set the CSS initial position to match the inline position.

        var initial_position = calculate_position.initial(top, left);
        $clone.css.apply($clone, initial_position);
        $pricing_container.prepend($clone);

        // add an active class to make the overlay appear.
        $pricing_overlay.addClass("active");
        // add a stick class to the inline pricing model to make the :hover
        // transform stick.
        $inline_overlay.addClass("stick");
        // remove any old pricing information and append the clone.


        setTimeout(function () {
            $clone.css.apply($clone, calculate_position.final(height));
            setTimeout(function () {
                $info_box.addClass("show");
                $info_box.css({
                    transform: "translateY(" + (window.innerHeight - 100 - height) / 2 + "px)",
                    height: height + "px",
                });
            }, 300);
        }, 300);
    });
    */

    $(window).resize(function () {
        if ($pricing_overlay.hasClass("active")) {
            $clone.css.apply($clone, calculate_position.final(height));
            $info_box.css("transform", "translateY(" + (window.innerHeight - 100 - height) / 2 + "px)");
        }
    });

    $pricing_overlay.click(function (e) {
        if ($(e.target).is(".pricing-container, .pricing-overlay")) {
            reset();
        }
    });
};

var events = function () {
    ScrollTo();

    $("a").click(function (e) {
        // if the pathname is different than what we are already on, run the
        // custom transition function.
        if (window.location.pathname !== this.pathname && !this.hasAttribute("download")) {
            e.preventDefault();
            $(".portico-landing").removeClass("show");
            setTimeout(function () {
                window.location.href = $(this).attr("href");
            }.bind(this), 500);
        }
    });

    // get the location url like `zulipchat.com/features/`, cut off the trailing
    // `/` and then split by `/` to get ["zulipchat.com", "features"], then
    // pop the last element to get the current section (eg. `features`).
    var location = window.location.pathname.replace(/\/#*$/, "").split(/\//).pop();

    $("[on-page='" + location + "']").addClass("active");

    $("body").click(function (e) {
        var $e = $(e.target);


        if ($e.is("nav ul .exit")) {
            $("nav ul").removeClass("show");
        }
    });

    $(".hamburger").click(function () {
        $("nav ul").addClass("show");
    });

    (function () {
        var $last = $(".details-box").eq(0).addClass("show");
        var $li = $("ul.sidebar li");
        var version;

        var nav_version = {
            Win: "windows",
            MacIntel: "mac",
            Linux: "linux",
            iP: "ios",
        };

        for (var x in nav_version) {
            if (navigator.platform.indexOf(x) !== -1) {
                $('li[data-name="' + nav_version[x] + '"]').click();
                version = nav_version[x];
                break;
            }
        }

        var switch_to_tab = function (elem) {
            var target = $(elem).data("name");
            var $el = $(".details-box[data-name='" + target + "']");

            // $li is a semi-global variable from the closure above.
            $li.removeClass("active");
            $(elem).addClass("active");

            $last.removeClass("show");
            $el.addClass("show");

            $last = $el;
        };

        // this is for the sidebar on the /apps/ page to trigger the correct info box.
        $li.click(function () {
            window.location.hash = $(this).data("name");
        });

        if (detectPath() === "apps") {
            var hash = function () {
                return window.location.hash.replace(/^#/, "");
            };

            switch_to_tab($("ul.sidebar li[data-name='" + (hash() || version || "windows") + "']"));

            window.onhashchange = function () {
                switch_to_tab($("ul.sidebar li[data-name='" + hash() + "']"));
            };
        }
    }());

    if (detectPath() === "integrations") {
        integration_events();
        integration_search();
    }

    if (detectPath() === "hello") {
        hello_events();
    }

    $('.integration-categories-dropdown .dropdown-toggle').click(function () {
        var $dropdown_list = $('.integration-categories-dropdown .dropdown-list');
        $dropdown_list.toggle();

        var $dropdown_icon = $('.integration-categories-dropdown i');
        if ($dropdown_list.css('display') === 'none') {
            $dropdown_icon
                .removeClass('icon-vector-angle-down')
                .addClass('icon-vector-angle-right');
        } else {
            $dropdown_icon
                .removeClass('icon-vector-angle-right')
                .addClass('icon-vector-angle-down');
        }
    });

    if (/\/plans\/*/.test(window.location.pathname)) {
        pricing_events();
    }
};


// run this callback when the page is determined to have loaded.
var load = function () {
    // show the .portico-landing when the document is loaded.
    setTimeout(function () {
        $(".portico-landing").addClass("show");
    }, 200);

    // display the `x-grad` element a second after load so that the slide up
    // transition on the .portico-landing is nice and smooth.
    setTimeout(function () {
        $("x-grad").addClass("show");
    }, 1000);

    // Set up events / categories / search
    events();
};

if (document.readyState === "complete") {
    load();
} else {
    $(document).ready(load);
}
