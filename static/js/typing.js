var typing = (function () {
var exports = {};
// How long before we assume a client has gone away
// and expire its typing status
var TYPING_STARTED_EXPIRY_PERIOD = 15000; // 15s
// How frequently 'still typing' notifications are sent
// to extend the expiry
var TYPING_STARTED_SEND_FREQUENCY = 10000; // 10s
// How long after someone stops editing in the compose box
// do we send a 'stopped typing' notification
var TYPING_STOPPED_WAIT_PERIOD = 5000; // 5s

var current_recipient;
var users_currently_typing = new Dict();

// Our logic is a bit too complex to encapsulate in
// _.throttle/_.debounce (since we need to cancel things), so we do it
// manually.
var stop_timer;
var last_start_time;

function send_typing_notification_ajax(recipients, operation) {
    channel.post({
        url: '/json/typing',
        data: {
            to: recipients,
            op: operation,
        },
        success: function () {},
        error: function (xhr) {
            blueslip.warn("Failed to send typing event: " + xhr.responseText);
        },
    });
}

function check_and_send(operation) {
    var compose_recipient = compose.recipient();
    var compose_nonempty = compose.has_message_content();

    // If we currently have an active typing notification out, and we
    // want to send a stop notice, or the compose recipient changed
    // (and implicitly we're sending a start notice), send a stop
    // notice to the old recipient.
    if (current_recipient !== undefined &&
        (operation === 'stop' ||
         current_recipient !== compose_recipient)) {
        send_typing_notification_ajax(current_recipient, 'stop');
        // clear the automatic stop notification timer and recipient.
        clearTimeout(stop_timer);
        stop_timer = undefined;
        current_recipient = undefined;
    }
    if (operation === 'start') {
        if (compose_recipient !== undefined && compose_nonempty) {
            current_recipient = compose_recipient;
            send_typing_notification_ajax(compose_recipient, operation);
        }
    }
}

// Start notifications
$(document).on('input', '#new_message_content', function () {
    // If our previous state was no typing notification, send a
    // start-typing notice immediately.
    var current_time = new Date();
    if (current_recipient === undefined ||
        current_time > last_start_time + TYPING_STARTED_SEND_FREQUENCY) {
        last_start_time = current_time;
        check_and_send("start");
    }

    // Then, regardless of whether we changed state, reset the
    // stop-notification timeout to TYPING_STOPPED_WAIT_PERIOD from
    // now, so that we'll send a stop notice exactly that long after
    // stopping typing.
    if (stop_timer !== undefined) {
        // Clear an existing stop_timer, if any.
        clearTimeout(stop_timer);
    }
    stop_timer = setTimeout(function () {
        check_and_send('stop');
    }, TYPING_STOPPED_WAIT_PERIOD);
});

// We send a stop-typing notification immediately when compose is
// closed/cancelled
$(document).on('compose_canceled.zulip compose_finished.zulip', function () {
    check_and_send('stop');
});

function full_name(email) {
    return people.get_by_email(email).full_name;
}

function get_users_typing_for_narrow() {
    if (!narrow.narrowed_to_pms()) {
        // Narrow is neither pm-with nor is: private
        return [];
    }
    if (narrow.operators()[0].operator === 'pm-with') {
        // Get list of users typing in this conversation
        var narrow_emails_string = narrow.operators()[0].operand;
        var narrow_user_ids_string = people.emails_strings_to_user_ids_string(narrow_emails_string);
        var narrow_user_ids = narrow_user_ids_string.split(',').map(function (user_id_string) {
            return parseInt(user_id_string, 10);
        });
        var group = narrow_user_ids.concat([page_params.user_id]);
        group.sort();
        return users_currently_typing.setdefault(group, []);
    }
    // Get all users typing (in all private conversations with current user)
    var all_typing_users = [];
    users_currently_typing.each(function (users_typing) {
        all_typing_users = all_typing_users.concat(users_typing);
    });
    return all_typing_users;
}

function render_notifications_for_narrow() {
    var user_ids = get_users_typing_for_narrow();
    var users_typing = user_ids.map(people.get_person_from_user_id);
    if (users_typing.length === 0) {
        $('#typing_notifications').hide();
    } else {
        $('#typing_notifications').html(templates.render('typing_notifications', {users: users_typing}));
        $('#typing_notifications').show();
    }
}

$(document).on('narrow_activated.zulip', render_notifications_for_narrow);
$(document).on('narrow_deactivated.zulip', render_notifications_for_narrow);

exports.hide_notification = function (event) {
    if (event.sender.user_id === page_params.user_id) {
        // The typing notification is also sent to the user who is typing
        // In this case the notification is not displayed
        return;
    }
    var recipients = event.recipients.map(function (user) {
        return user.user_id;
    });
    recipients.sort();
    var users_typing = users_currently_typing.get(recipients);
    var i = users_typing.indexOf(event.sender.user_id);
    if (i !== -1) {
        users_typing.splice(i);
    }
    render_notifications_for_narrow();
};

var debounced_hide_notification = _.debounce(exports.hide_notification,
    TYPING_STARTED_EXPIRY_PERIOD);

exports.display_notification = function (event) {
    var recipients = event.recipients.map(function (user) {
        return user.user_id;
    });
    recipients.sort();
    if (event.sender.user_id === page_params.user_id) {
        // The typing notification is also sent to the user who is typing
        // In this case the notification is not displayed
        return;
    }
    event.sender.name = full_name(event.sender.email);
    var users_typing = users_currently_typing.setdefault(recipients, []);
    var i = users_typing.indexOf(event.sender.user_id);
    if (i === -1) {
      // Add sender to list of users currently typing in conversation
      users_typing.push(event.sender.user_id);
    }
    render_notifications_for_narrow();
    debounced_hide_notification(event);
};

return exports;
}());

if (typeof module !== 'undefined') {
    module.exports = typing;
}
