"use strict";

const assert = require("node:assert/strict");

const _ = require("lodash");

const {zrequire, set_global} = require("./lib/namespace.cjs");
const {run_test} = require("./lib/test.cjs");

const emoji = zrequire("emoji");
const emoji_frequency = zrequire("emoji_frequency");
const emoji_frequency_data = zrequire("emoji_frequency_data");
const emoji_picker = zrequire("emoji_picker");
const typeahead = zrequire("typeahead");

const emoji_codes = zrequire("../../static/generated/emoji/emoji_codes.json");

set_global("document", "document-stub");

run_test("initialize", () => {
    emoji.initialize({
        realm_emoji: {},
        emoji_codes,
    });
    typeahead.set_frequently_used_emojis(typeahead.get_popular_emojis());
    emoji_picker.initialize();

    const complete_emoji_catalog = _.sortBy(emoji_picker.complete_emoji_catalog, "name");
    assert.equal(complete_emoji_catalog.length, 11);
    assert.equal(emoji.emojis_by_name.size, 1884);

    let total_emoji_in_categories = 0;

    function assert_emoji_category(ele, icon, num) {
        assert.equal(ele.icon, icon);
        assert.equal(ele.emojis.length, num);
        function check_emojis(val) {
            for (const this_emoji of ele.emojis) {
                assert.equal(this_emoji.is_realm_emoji, val);
            }
        }
        if (ele.name === "Custom") {
            check_emojis(true);
        } else {
            check_emojis(false);
            total_emoji_in_categories += ele.emojis.length;
        }
    }
    const popular_emoji_count = 6;
    const zulip_emoji_count = 1;
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-car", 195);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-hashtag", 224);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-smile-o", 169);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-thumbs-o-up", 386);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-lightbulb-o", 264);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-star-o", popular_emoji_count);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-cutlery", 131);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-flag", 270);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-cog", 1);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-leaf", 159);
    assert_emoji_category(complete_emoji_catalog.pop(), "fa-soccer-ball-o", 85);

    // The popular emoji appear twice in the picker, and the zulip emoji is special
    assert.equal(
        emoji.emojis_by_name.size,
        total_emoji_in_categories - popular_emoji_count + zulip_emoji_count,
    );

    // Helper to create a ReactionUsage entry with message_ids sets
    // that produce the desired score via compute_score:
    //   score = 5 * your_messages + others_messages + popular_bonus
    let next_message_id = 1;
    const make_usage = (emoji_code, others_messages, your_messages = 0) => {
        const message_ids = new Set();
        const current_user_reacted_message_ids = new Set();
        for (let j = 0; j < your_messages; j += 1) {
            const id = next_message_id;
            next_message_id += 1;
            message_ids.add(id);
            current_user_reacted_message_ids.add(id);
        }
        for (let j = 0; j < others_messages; j += 1) {
            const id = next_message_id;
            next_message_id += 1;
            message_ids.add(id);
        }
        return {
            emoji_code,
            emoji_type: "unicode_emoji",
            message_ids,
            current_user_reacted_message_ids,
        };
    };

    // Set up popular_emoji_ids (score gets +12 popular bonus)
    emoji_frequency_data.popular_emoji_ids.clear();
    for (const emoji_code of typeahead.popular_emojis) {
        emoji_frequency_data.popular_emoji_ids.add(`unicode_emoji,${emoji_code}`);
    }

    // Popular emoji: 0 message reactions, but 12 popular bonus = score 12
    for (const emoji_code of typeahead.popular_emojis) {
        const key = `unicode_emoji,${emoji_code}`;
        emoji_frequency_data.reaction_data.set(key, make_usage(emoji_code, 0));
    }

    // Non-popular emoji with varying numbers of others' reactions
    const non_popular_emoji_codes = [
        "1f3df", // stadium
        "1f4b0", // money bag
        "1f3e3", // japanese post office
        "1f43c", // panda face
        "1f648", // see no evil
        "1f600", // grinning face
        "1f680", // rocket
    ];
    for (const [i, non_popular_emoji_code] of non_popular_emoji_codes.entries()) {
        const key = `unicode_emoji,${non_popular_emoji_code}`;
        // scores: 10, 11, 12, 13, 14, 15, 16
        emoji_frequency_data.reaction_data.set(key, make_usage(non_popular_emoji_code, i + 10));
    }
    emoji_frequency.update_frequently_used_emojis_list();
    non_popular_emoji_codes.reverse();

    // Scores (descending): rocket=16, grinning=15, see_no_evil=14,
    // panda=13, then 7 emoji at score 12 (6 popular + japanese_post_office),
    // money_bag=11, stadium=10. Total 13 items with score >= 10,
    // rounded down to 12.
    // Ties at score 12 are ordered by Map insertion (popular first).
    assert.equal(typeahead.frequently_used_emojis.length, 12);
    assert.deepEqual(
        typeahead.frequently_used_emojis.map((emoji) => emoji.emoji_code),
        [
            // non-popular with score > 12
            ...non_popular_emoji_codes.slice(0, 4),
            // popular emoji (score 12, inserted first)
            ...typeahead.popular_emojis,
            // non-popular with score 12 (japanese post office) and 11 (money bag)
            ...non_popular_emoji_codes.slice(4, 6),
        ],
    );
});

run_test("remove_message_reactions processes all emoji_ids", () => {
    emoji_frequency_data.reaction_data.clear();
    emoji_frequency_data.popular_emoji_ids.clear();

    // Set up two emoji with reactions on message 100.
    emoji_frequency_data.reaction_data.set("unicode_emoji,1f44d", {
        emoji_code: "1f44d",
        emoji_type: "unicode_emoji",
        message_ids: new Set([100]),
        current_user_reacted_message_ids: new Set([100]),
    });
    emoji_frequency_data.reaction_data.set("unicode_emoji,2764", {
        emoji_code: "2764",
        emoji_type: "unicode_emoji",
        message_ids: new Set([100]),
        current_user_reacted_message_ids: new Set(),
    });

    // Remove reactions with an unknown emoji_id first in the list.
    // Before the return-to-continue fix, this would exit early,
    // skipping removal for the remaining emoji_ids.
    emoji_frequency_data.remove_message_reactions({
        message_id: 100,
        emoji_ids: ["unicode_emoji,unknown", "unicode_emoji,1f44d", "unicode_emoji,2764"],
    });

    const thumbsup = emoji_frequency_data.reaction_data.get("unicode_emoji,1f44d");
    assert.equal(thumbsup.message_ids.size, 0);
    assert.equal(thumbsup.current_user_reacted_message_ids.size, 0);

    const heart = emoji_frequency_data.reaction_data.get("unicode_emoji,2764");
    assert.equal(heart.message_ids.size, 0);
});

run_test("handle_reaction_addition counts user when others reacted first", () => {
    emoji_frequency_data.reaction_data.clear();
    emoji_frequency_data.popular_emoji_ids.clear();

    // Another user reacts first on message 200.
    emoji_frequency_data.handle_reaction_addition_on_message({
        message_id: 200,
        emoji_id: "unicode_emoji,1f44d",
        emoji_code: "1f44d",
        emoji_type: "unicode_emoji",
        is_me: false,
    });

    // Current user reacts to the same message with the same emoji.
    emoji_frequency_data.handle_reaction_addition_on_message({
        message_id: 200,
        emoji_id: "unicode_emoji,1f44d",
        emoji_code: "1f44d",
        emoji_type: "unicode_emoji",
        is_me: true,
    });

    const usage = emoji_frequency_data.reaction_data.get("unicode_emoji,1f44d");
    assert.equal(usage.message_ids.size, 1);
    // The current user's reaction should be tracked even though the
    // message was already in message_ids from the other user's reaction.
    assert.equal(usage.current_user_reacted_message_ids.size, 1);
    assert.ok(usage.current_user_reacted_message_ids.has(200));
});

run_test("handle_reaction_removal preserves message_ids when emoji still on message", () => {
    emoji_frequency_data.reaction_data.clear();
    emoji_frequency_data.popular_emoji_ids.clear();

    // Both another user and current user react on message 300.
    emoji_frequency_data.handle_reaction_addition_on_message({
        message_id: 300,
        emoji_id: "unicode_emoji,1f44d",
        emoji_code: "1f44d",
        emoji_type: "unicode_emoji",
        is_me: false,
    });
    emoji_frequency_data.handle_reaction_addition_on_message({
        message_id: 300,
        emoji_id: "unicode_emoji,1f44d",
        emoji_code: "1f44d",
        emoji_type: "unicode_emoji",
        is_me: true,
    });

    // Current user removes their reaction, but emoji is still on message
    // (another user still has it).
    emoji_frequency_data.handle_reaction_removal_on_message({
        emoji_id: "unicode_emoji,1f44d",
        message_id: 300,
        is_me: true,
        emoji_still_on_message: true,
    });

    const usage = emoji_frequency_data.reaction_data.get("unicode_emoji,1f44d");
    // message_ids should still have message 300 since another user's reaction remains.
    assert.equal(usage.message_ids.size, 1);
    assert.ok(usage.message_ids.has(300));
    // But current_user_reacted_message_ids should be cleared.
    assert.equal(usage.current_user_reacted_message_ids.size, 0);
});

run_test("is_emoji_present_in_text", () => {
    const thermometer_emoji = {
        name: "thermometer",
        emoji_code: "1f321",
        reaction_type: "unicode_emoji",
    };
    const headphones_emoji = {
        name: "headphones",
        emoji_code: "1f3a7",
        reaction_type: "unicode_emoji",
    };
    assert.equal(emoji_picker.is_emoji_present_in_text("🌡", thermometer_emoji), true);
    assert.equal(
        emoji_picker.is_emoji_present_in_text("no emojis at all", thermometer_emoji),
        false,
    );
    assert.equal(emoji_picker.is_emoji_present_in_text("😎", thermometer_emoji), false);
    assert.equal(emoji_picker.is_emoji_present_in_text("😎🌡🎧", thermometer_emoji), true);
    assert.equal(emoji_picker.is_emoji_present_in_text("😎🎧", thermometer_emoji), false);
    assert.equal(emoji_picker.is_emoji_present_in_text("😎🌡🎧", headphones_emoji), true);
    assert.equal(
        emoji_picker.is_emoji_present_in_text("emojis with text 😎🌡🎧", thermometer_emoji),
        true,
    );
    assert.equal(
        emoji_picker.is_emoji_present_in_text("emojis with text no space😎🌡🎧", headphones_emoji),
        true,
    );
});
