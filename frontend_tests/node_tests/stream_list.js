global.stub_out_jquery();

add_dependencies({
    Handlebars: 'handlebars',
    templates: 'js/templates',
    muting: 'js/muting',
    narrow: 'js/narrow',
    people: 'js/people',
    stream_color: 'js/stream_color',
    stream_data: 'js/stream_data',
    subs: 'js/subs',
    util: 'js/util',
    hashchange: 'js/hashchange',
});

set_global('unread', {});
set_global('message_store', {
    recent_private_messages: new global.Array(),
});

// TODO: move pm_list-related tests to their own module
var pm_list = require('js/pm_list.js');
var stream_list = require('js/stream_list.js');

var jsdom = require("jsdom");
var window = jsdom.jsdom().defaultView;
global.$ = require('jquery')(window);
$.fn.expectOne = function () {
    assert(this.length === 1);
    return this;
};

global.compile_template('sidebar_private_message_list');
global.compile_template('stream_sidebar_row');
global.compile_template('stream_privacy');

var alice = {
    email: 'alice@zulip.com',
    user_id: 101,
    full_name: 'Alice',
};
var bob = {
    email: 'bob@zulip.com',
    user_id: 102,
    full_name: 'Bob',
};
global.people.add_in_realm(alice);
global.people.add_in_realm(bob);

(function test_build_private_messages_list() {
    var active_conversation = "alice@zulip.com,bob@zulip.com";
    var max_conversations = 5;


    var conversations = {user_ids_string: '101,102',
                         display_reply_to: active_conversation,
                         timestamp: 0 };
    global.message_store.recent_private_messages.push(conversations);

    global.unread.num_unread_for_person = function () {
        return 1;
    };

    var convos_html = pm_list._build_private_messages_list(active_conversation, max_conversations);
    global.write_test_output("test_build_private_messages_list", convos_html);

    var conversation = $(convos_html).find('a').text().trim();
    assert.equal(conversation, active_conversation);
}());

function clear_filters() {
    var stream_search_box = $('<input class="stream-list-filter" type="text" placeholder="Search streams">');
    var stream_filters = $('<ul id="stream_filters">');
    $("body").empty();
    $("body").append(stream_search_box);
    $("body").append(stream_filters);

}

(function test_create_sidebar_row() {
    // Make a couple calls to create_sidebar_row() and make sure they
    // generate the right markup as well as play nice with get_stream_li().

    clear_filters();

    var devel = {
        name: 'devel',
        stream_id: 100,
        color: 'blue',
        subscribed: true,
        id: 5,
    };
    global.stream_data.add_sub('devel', devel);

    var social = {
        name: 'social',
        stream_id: 200,
        color: 'green',
        subscribed: true,
        id: 6,
    };
    global.stream_data.add_sub('social', social);

    stream_list.create_sidebar_row(devel);
    stream_list.create_sidebar_row(social);
    stream_list.build_stream_list();

    var html = $("body").html();
    global.write_test_output("test_create_sidebar_row", html);

    var li = stream_list.get_stream_li('social');
    assert.equal(li.attr('data-name'), 'social');
    assert.equal(li.find('.streamlist_swatch').attr('style'), 'background-color: green');
    assert.equal(li.find('a.stream-name').text().trim(), 'social');
    assert(li.find('.arrow').find("i").hasClass("icon-vector-chevron-down"));

    global.append_test_output("Then make 'social' private.");
    global.stream_data.get_sub('social').invite_only = true;

    stream_list.redraw_stream_privacy('social');

    html = $("body").html();
    global.append_test_output(html);

    assert(li.find('.stream-privacy').find("i").hasClass("icon-vector-lock"));
}());


(function test_sort_pin_to_top_streams() {
    clear_filters();

    var develSub = {
        name: 'devel',
        stream_id: 1000,
        color: 'blue',
        id: 5,
        pin_to_top: false,
        subscribed: true,
    };
    stream_list.create_sidebar_row(develSub);
    global.stream_data.add_sub('devel', develSub);

    var socialSub = {
        name: 'social',
        stream_id: 2000,
        color: 'green',
        id: 6,
        pin_to_top: true,
        subscribed: true,
    };
    stream_list.create_sidebar_row(socialSub);
    global.stream_data.add_sub('social', socialSub);
    stream_list.build_stream_list();
    var li = stream_list.stream_sidebar.get_row(socialSub.stream_id).get_li();
    assert.equal(li.nextAll().find('[ data-name="devel"]').length, 1);
}());
