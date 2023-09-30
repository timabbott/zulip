import $ from "jquery";

import * as hash_util from "./hash_util";
import * as popovers from "./popovers";
import * as resize from "./resize";

export let left_sidebar_expanded_as_overlay = false;
export let right_sidebar_expanded_as_overlay = false;

export function hide_userlist_sidebar() {
    $(".app-main .column-right").removeClass("expanded");
    right_sidebar_expanded_as_overlay = false;
}

export function show_userlist_sidebar() {
    $(".app-main .column-right").addClass("expanded");
    resize.resize_page_components();
    right_sidebar_expanded_as_overlay = true;
}

export function show_streamlist_sidebar() {
    $(".app-main .column-left").addClass("expanded");
    resize.resize_stream_filters_container();
    left_sidebar_expanded_as_overlay = true;
}

export function hide_streamlist_sidebar() {
    $(".app-main .column-left").removeClass("expanded");
    left_sidebar_expanded_as_overlay = false;
}

export function any_sidebar_expanded_as_overlay() {
    return left_sidebar_expanded_as_overlay || right_sidebar_expanded_as_overlay;
}

export function initialize() {
    $("body").on("click", ".login_button", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = hash_util.build_login_link();
    });

    $("#userlist-toggle-button").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        popovers.hide_all();
        if (!right_sidebar_expanded_as_overlay) {
            show_userlist_sidebar();
        }
    });

    $("#streamlist-toggle-button").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        popovers.hide_all();
        if (!left_sidebar_expanded_as_overlay) {
            show_streamlist_sidebar();
        }
    });
}
