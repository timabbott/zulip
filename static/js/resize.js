var autosize = require('autosize');

var resize = (function () {

var exports = {};

function get_new_heights() {
    var res = {};
    var viewport_height = message_viewport.height();
    var top_navbar_height = $("#top_navbar").safeOuterHeight(true);

    res.bottom_whitespace_height = viewport_height * 0.4;
    res.main_div_min_height = viewport_height - top_navbar_height;
    return res;
}

exports.watch_manual_resize = function (element) {
    return (function on_box_resize(cb) {
        var box = document.querySelector(element);

        if (!box) {
            blueslip.error('Bad selector in watch_manual_resize: ' + element);
            return;
        }

        var meta = {
            box: box,
            height: null,
            mousedown: false,
        };

        var box_handler = function () {
            meta.mousedown = true;
            meta.height = meta.box.clientHeight;
        };
        meta.box.addEventListener("mousedown", box_handler);

        // If the user resizes the textarea manually, we use the
        // callback to stop autosize from adjusting the height.
        var body_handler = function () {
            if (meta.mousedown === true) {
                meta.mousedown = false;
                if (meta.height !== meta.box.clientHeight) {
                    meta.height = meta.box.clientHeight;
                    cb.call(meta.box, meta.height);
                }
            }
        };
        document.body.addEventListener("mouseup", body_handler);

        return [box_handler, body_handler];
    }(function (height) {
        // This callback disables autosize on the textarea.  It
        // will be re-enabled when this component is next opened.
        autosize.destroy($(element))
            .height(height + "px");
    }));
};

exports.resize_bottom_whitespace = function (h) {
    if (h !== undefined) {
        $("#bottom_whitespace").height(h.bottom_whitespace_height);
    }
};

exports.resize_page_components = function () {
    var h;
    h = get_new_heights();
    exports.resize_bottom_whitespace(h);
    panels.resize_app();
};

var _old_width = $(window).width();

exports.handler = function () {
    var new_width = $(window).width();

    if (new_width !== _old_width) {
        _old_width = new_width;
        condense.clear_message_content_height_cache();
    }

    // On mobile web, we want to avoid hiding a popover here,
    // especially if this resize was triggered by a virtual keyboard
    // popping up when the user opened that very popover.
    var mobile = util.is_mobile();
    if (!mobile) {
        popovers.hide_all();
    }
    exports.resize_page_components();

    // Re-compute and display/remove [More] links to messages
    condense.condense_and_collapse($("div.message_row"));

    // This function might run onReady (if we're in a narrow window),
    // but before we've loaded in the messages; in that case, don't
    // try to scroll to one.
    if (current_msg_list.selected_id() !== -1) {
        if (mobile) {
            popovers.set_suppress_scroll_hide();
        }

        navigate.scroll_to_selected();
    }
};

return exports;
}());

if (typeof module !== 'undefined') {
    module.exports = resize;
}
window.resize = resize;
