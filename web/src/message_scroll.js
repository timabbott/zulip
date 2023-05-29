import $ from "jquery";
import _ from "lodash";

import * as compose_banner from "./compose_banner";
import * as hash_util from "./hash_util";
import * as message_fetch from "./message_fetch";
import * as message_lists from "./message_lists";
import * as message_viewport from "./message_viewport";
import * as narrow_banner from "./narrow_banner";
import * as narrow_state from "./narrow_state";
import * as recent_topics_util from "./recent_topics_util";
import * as unread from "./unread";
import * as unread_ops from "./unread_ops";
import * as unread_ui from "./unread_ui";

let actively_scrolling = false;

// Tracks whether the next scroll that will complete is initiated by
// code, not the user, and thus should avoid moving the selected
// message.
let update_selection_on_next_scroll = true;

export function suppress_selection_update_on_next_scroll() {
    update_selection_on_next_scroll = false;
}

// Whether a keyboard shortcut is triggering a message feed scroll event.
let keyboard_triggered_current_scroll = false;

export function mark_keyboard_triggered_current_scroll() {
    keyboard_triggered_current_scroll = true;
}

export function show_history_limit_notice() {
    $(".top-messages-logo").hide();
    $(".history-limited-box").show();
    narrow_banner.hide_empty_narrow_message();
}

export function hide_history_limit_notice() {
    $(".top-messages-logo").show();
    $(".history-limited-box").hide();
}

export function hide_end_of_results_notice() {
    $(".all-messages-search-caution").hide();
}

export function show_end_of_results_notice() {
    $(".all-messages-search-caution").show();

    // Set the link to point to this search with streams:public added.
    // Note that element we adjust is not visible to spectators.
    const operators = narrow_state.filter().operators();
    const update_hash = hash_util.search_public_streams_notice_url(operators);
    $(".all-messages-search-caution a.search-shared-history").attr("href", update_hash);
}

export function update_top_of_narrow_notices(msg_list) {
    // Assumes that the current state is all notices hidden (i.e. this
    // will not hide a notice that should not be there)
    if (msg_list !== message_lists.current) {
        return;
    }

    if (
        msg_list.data.fetch_status.has_found_oldest() &&
        message_lists.current !== message_lists.home
    ) {
        const filter = narrow_state.filter();
        if (filter === undefined && !narrow_state.is_message_feed_visible()) {
            // user moved away from the narrow / filter to recent topics.
            return;
        }
        // Potentially display the notice that lets users know
        // that not all messages were searched.  One could
        // imagine including `filter.is_search()` in these
        // conditions, but there's a very legitimate use case
        // for moderation of searching for all messages sent
        // by a potential spammer user.
        if (
            !filter.contains_only_private_messages() &&
            !filter.includes_full_stream_history() &&
            !filter.is_personal_filter()
        ) {
            show_end_of_results_notice();
        }
    }

    if (msg_list.data.fetch_status.history_limited()) {
        show_history_limit_notice();
    }
}

export function hide_top_of_narrow_notices() {
    hide_end_of_results_notice();
    hide_history_limit_notice();
}

let hide_scroll_to_bottom_timer;
export function hide_scroll_to_bottom() {
    const $show_scroll_to_bottom_button = $("#scroll-to-bottom-button-container");
    if (message_viewport.bottom_message_visible() || message_lists.current.visibly_empty()) {
        // If last message is visible, just hide the
        // scroll to bottom button.
        $show_scroll_to_bottom_button.removeClass("show");
        return;
    }

    // Wait before hiding to allow user time to click on the button.
    hide_scroll_to_bottom_timer = setTimeout(() => {
        // Don't hide if user is hovered on it.
        if (
            !narrow_state.narrowed_by_topic_reply() &&
            !$show_scroll_to_bottom_button.get(0).matches(":hover")
        ) {
            $show_scroll_to_bottom_button.removeClass("show");
        }
    }, 3000);
}

export function show_scroll_to_bottom_button() {
    if (message_viewport.bottom_message_visible()) {
        // Only show scroll to bottom button when
        // last message is not visible in the
        // current scroll position.
        return;
    }

    clearTimeout(hide_scroll_to_bottom_timer);
    $("#scroll-to-bottom-button-container").addClass("show");
}

$(document).on("keydown", (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
        return;
    }

    // Hide scroll to bottom button on any keypress.
    // Keyboard users are very less likely to use this button.
    $("#scroll-to-bottom-button-container").removeClass("show");
});

export function is_actively_scrolling() {
    return actively_scrolling;
}

export function scroll_finished() {
    actively_scrolling = false;
    message_lists.current.view.update_sticky_recipient_headers();
    hide_scroll_to_bottom();

    if (recent_topics_util.is_visible()) {
        return;
    }

    if (compose_banner.scroll_to_message_banner_message_id !== null) {
        const $message_row = message_lists.current.get_row(
            compose_banner.scroll_to_message_banner_message_id,
        );
        if ($message_row.length > 0 && !message_viewport.is_message_below_viewport($message_row)) {
            compose_banner.clear_message_sent_banners(false);
        }
    }

    if (update_selection_on_next_scroll) {
        message_viewport.keep_pointer_in_view();
    } else {
        update_selection_on_next_scroll = true;
    }

    if (message_viewport.at_top()) {
        message_fetch.maybe_load_older_messages({
            msg_list: message_lists.current,
        });
    }

    if (message_viewport.at_bottom()) {
        message_fetch.maybe_load_newer_messages({
            msg_list: message_lists.current,
        });
    }

    // When the window scrolls, it may cause some messages to
    // enter the screen and become read.  Calling
    // unread_ops.process_visible will update necessary
    // data structures and DOM elements.
    setTimeout(unread_ops.process_visible, 0);
}

let scroll_timer;
function scroll_finish() {
    actively_scrolling = true;

    // Don't present the "scroll to bottom" widget if the current
    // scroll was triggered by the keyboard.
    if (!keyboard_triggered_current_scroll) {
        show_scroll_to_bottom_button();
    }
    keyboard_triggered_current_scroll = false;

    clearTimeout(scroll_timer);
    scroll_timer = setTimeout(scroll_finished, 100);
}

export function initialize() {
    message_viewport.$message_pane.on(
        "scroll",
        _.throttle(() => {
            unread_ops.process_visible();
            scroll_finish();
        }, 50),
    );

    // Scroll handler that marks messages as read when you scroll past them.
    $(document).on("message_selected.zulip", (event) => {
        if (event.id === -1) {
            return;
        }

        if (event.mark_read && event.previously_selected_id !== -1) {
            // Mark messages between old pointer and new pointer as read
            let messages;
            if (event.id < event.previously_selected_id) {
                messages = event.msg_list.message_range(event.id, event.previously_selected_id);
            } else {
                messages = event.msg_list.message_range(event.previously_selected_id, event.id);
            }
            if (event.msg_list.can_mark_messages_read()) {
                unread_ops.notify_server_messages_read(messages, {from: "pointer"});
            } else if (
                unread.get_unread_messages(messages).length !== 0 &&
                // The below checks might seem redundant, but it's
                // possible this logic, which runs after a delay, lost
                // a race with switching to another view, like Recent
                // Topics, and we don't want to display this banner
                // in such a view.
                //
                // This can likely be fixed more cleanly with another approach.
                narrow_state.filter() !== undefined &&
                message_lists.current === event.msg_list
            ) {
                unread_ui.notify_messages_remain_unread();
            }
        }
    });
}
