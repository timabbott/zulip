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

var events = function () {
    ScrollTo();

    $("a").click(function (e) {
        e.preventDefault();
        $("#app").removeClass("show");
        setTimeout(function () {
            window.location.href = $(this).attr("href");
        }.bind(this), 500);
    });

    // get the location url like `zulipchat.com/features/`, cut off the trailing
    // `/` and then split by `/` to get ["zulipchat.com", "features"], then
    // pop the last element to get the current section (eg. `features`).
    var location = window.location.href.replace(/\/$/, "").split(/\//).pop();

    $("[on-page='" + location + "']").addClass("active");

    $("body").click(function (e) {
        var $e = $(e.target);

        var should_close = !$e.is("ul, #hamburger") && $e.closest("ul, #hamburger").length === 0;

        // this means that it is in mobile sidebar mode.
        if ($("nav ul").height() === window.innerHeight && should_close) {
            $("nav ul").removeClass("show");
        }
    });

    $("#hamburger").click(function (e) {
        $("nav ul").addClass("show");
    });
};

$(document).ready(function () {
    // show the #app when the document is loaded.
    $("#app").addClass("show");

    (function () {
        // switch the hero images once every 4 seconds.
        setInterval(function () {
            $("x-grad").toggleClass("orange-grad blue-grad");
        }, 4000);
    }());

    // display the `x-grad` element a second after load so that the slide up
    // transition on the #app is nice and smooth.
    setTimeout(function () {
        $("x-grad").addClass("show");
    }, 1000);

    // Set events.
    events();
});
