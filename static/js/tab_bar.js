const render_tab_bar = require('../templates/tab_bar.hbs');

function make_tab(title, icon, data, extra_class, sub_count, narrow_description) {
    return {cls: extra_class || "",
            title: title,
            data: data,
            icon: icon,
            sub_count: sub_count,
            narrow_description: narrow_description,
    };
}

function make_tab_data() {
    const filter = narrow_state.filter();
    if (narrow_state.active()) {
        if (filter.has_operand("in", "all")) {
            return make_tab("All Messages", "home", undefined, "root");
        } else if (narrow_state.operators().length > 0) {
            if (filter.has_operator("stream")) {
                const stream = filter.operands("stream")[0];
                const current_stream  = stream_data.get_sub_by_name(stream);
                if (current_stream === undefined) {
                    // return default
                    return make_tab('All messages', "home", "home", "root");
                }
                let icon;
                if (current_stream.invite_only) {
                    icon = "lock";
                }
                let formated_sub_count = current_stream.subscriber_count;
                if (formated_sub_count >= 1000) {
                // parseInt() is used to floor the value of divison to an integer
                    formated_sub_count = parseInt(formated_sub_count / 1000, 10) + "k";
                }
                return make_tab(stream, icon, stream, 'stream',
                                formated_sub_count, current_stream.description);
            } else if (filter.has_operand("is", "private")) {
                return make_tab("Private Messages", "envelope", undefined, 'private_message ');
            } else if (filter.has_operator("pm-with")) {
                // We show PMs tabs as just the name(s) of the participant(s)
                const emails = filter.operands("pm-with")[0].split(',');
                const names = _.map(emails, function (email) {
                    if (!people.get_by_email(email)) {
                        return email;
                    }
                    return people.get_by_email(email).full_name;
                });
                return make_tab(names.join(', '), "envelope");
            } else if (filter.has_operator("group-pm-with")) {
                return make_tab("Group Private", "envelope", undefined, 'private_message ');
            } else if (filter.has_operand("is", "starred")) {
                return make_tab("Starred", "star");
            } else if (filter.has_operand("streams", "public")) {
                return make_tab("Public Streams", undefined);
            } else if (filter.has_operator("near")) {
                return make_tab("Near " + filter.operands("near")[0], undefined);
            } else if (filter.has_operator("id")) {
                return make_tab("ID " + filter.operands("id")[0], undefined);
            } else if (filter.has_operand("is", "mentioned")) {
                return make_tab("Mentions", "at");
            } else if (filter.has_operator("sender")) {
                let sender = filter.operands("sender")[0];
                if (people.get_by_email(sender)) {
                    sender = people.get_by_email(sender).full_name;
                }
                return make_tab("Sent by " + sender, undefined);
            } else if (filter.has_operator("search")) {
                return make_tab("Search results", undefined);
            }
        }
    }
    return make_tab('All messages', "home", "home", "root");
}

exports.colorize_tab_bar = function () {
    const stream_tab = $('#tab_list .stream');
    if (stream_tab.length > 0) {
        let stream_name = stream_tab.data('name');
        if (stream_name === undefined) {
            return;
        }
        stream_name = stream_name.toString();

        const color_for_stream = stream_data.get_color(stream_name);
        const stream_light = colorspace.getHexColor(colorspace.getDecimalColor(color_for_stream));

        $("#tab_list .hash").css('color', stream_light);
        $("#tab_list .fa.fa-lock").css('color', stream_light);
    }
};

// this is a hacky way to prevent the description from running onto the search icon
exports.set_max_width_of_descriptions = function ()  {
    // do nothing at init
    const filter = narrow_state.filter();
    if (filter === undefined) {
        return;
    }

    if (filter.has_operator("stream")) {
        const sub_count = $(".sub_count");
        const stream = $(".stream");
        if (stream.css("width") === undefined || sub_count.css("width") === undefined) {
            return;
        }
        const sub_count_width = sub_count.css("width").slice(0, -2);
        const stream_width = stream.css("width").slice(0, -2);
        const tab_width = $("#tab_list").css("width").slice(0, -2);
        $(".narrow_description").css("display", "");
        sub_count.show();
        let view_specific_offset = 85;
        if (message_viewport.is_narrow()) {
            if (window.innerWidth <= 775) {
                view_specific_offset =  190;
            } else {
                view_specific_offset = 165;
            }
        }
        const narrow_description_max_width = tab_width
                                            - stream_width - sub_count_width - view_specific_offset;
        if (narrow_description_max_width <= 16) {
            // hide narrow when elipses can no longer be displayed correctly
            $(".narrow_description").hide();
        }
        if (narrow_description_max_width <= -7) {
            // hide sub_count and vertical bars when they no longer fit
            sub_count.hide();
        }
        // set max width of narrow_description
        $(".narrow_description").css("max-width",
                                     narrow_description_max_width + "px");
        // if the stream name is too long and sub count and description are closed
        const stream_max_width = tab_width - view_specific_offset + 40;
        stream.css("max-width", stream_max_width + "px");
    }
};

exports.update_stream_description = function (new_description) {
    const stream_description = $(".narrow_description");
    if (stream_description !== undefined) {
        stream_description.html("");
        stream_description.append(new_description);
    }
};
function toggle_search_and_select() {
    if (!$(".navbar-search").hasClass("expanded")) {
        search.initiate_search();
    } else {
        $("#tab_list").removeClass("hidden");
        $(".navbar-search").removeClass("expanded");
    }
}

exports.toggle_search_or_nav = function () {
    $(".navbar-search").toggleClass("expanded");
    $("#tab_list").toggleClass("hidden");
};

function reset_nav_bar() {
    $("#tab_list").removeClass("hidden");
    $(".navbar-search").removeClass("expanded");
    $(".search_icon").off();
    $(".search_icon").on("click", toggle_search_and_select);
    $("#searchbox_legacy .input-append .fa-search").removeClass('deactivated');
}

function lock_search_bar_as_open() {
    const filter = narrow_state.filter();
    if (filter === undefined) {
        return;
    }
    const operator_terms = filter.operators();
    if (filter.has_operator("search") ||
        filter.has_operator("near") || filter.has_operator("ID") ||
        filter.has_operator("is") && (filter.operands("is")[0] === "alerted" || filter.operands("is")[0] === "unread") ||
        operator_terms.length > 1 &&  !(operator_terms.length === 2 && filter.has_operator("stream") && filter.has_operator("topic"))) {
        // the next line acts as a call to open the search bar as it is intitially styled as hidden.
        exports.toggle_search_or_nav();
        $(".search_icon").off();
        $("#searchbox_legacy .input-append .fa-search").addClass('deactivated');
    }
    return;
}

function display_tab_bar(tab_bar_data) {
    const tab_bar = $("#tab_bar");
    tab_bar.empty();
    const rendered =  render_tab_bar(tab_bar_data);
    tab_bar.append(rendered);
    exports.set_max_width_of_descriptions();
    exports.colorize_tab_bar();
    tab_bar.removeClass('notdisplayed');
}

function build_tab_bar() {
    display_tab_bar(make_tab_data());
    reset_nav_bar();
    lock_search_bar_as_open();
}

exports.update_stream_name = function (new_name) {
    const tab_bar_data = make_tab_data();
    tab_bar_data.title = new_name;
    display_tab_bar(tab_bar_data);
};

exports.initialize = function () {
    build_tab_bar();
};

window.tab_bar = exports;
