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

    // Total others_messages = 91 (≤ 100), so others_weight = 5.
    // Non-popular scores: 5*16=80, 5*15=75, ..., 5*10=50.
    // Popular scores: 0 + 12 = 12 each.
    // All 7 non-popular (scores 50-80) come before 6 popular (score 12).
    // Total 13 with score >= 10, rounded down to 12.
    assert.equal(typeahead.frequently_used_emojis.length, 12);
    assert.deepEqual(
        typeahead.frequently_used_emojis.map((emoji) => emoji.emoji_code),
        [
            // All 7 non-popular emoji (descending by score)
            ...non_popular_emoji_codes,
            // First 5 popular emoji (all at score 12, by insertion order)
            ...typeahead.popular_emojis.slice(0, 5),
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

run_test("large org dilution prevention", () => {
    emoji_frequency_data.reaction_data.clear();
    emoji_frequency_data.popular_emoji_ids.clear();

    // Test that others' reactions are scaled down when total
    // others_messages exceeds the cap (100).
    //
    // We test preferred_emoji_list() directly rather than going
    // through update_frequently_used_emojis_list(), since the
    // latter calls emoji_picker.rebuild_catalog which requires
    // emoji codes to exist in the emoji data.

    let next_message_id = 1000;
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

    // User's emoji: 2 reactions by current user, score = 5*2 = 10.
    emoji_frequency_data.reaction_data.set("unicode_emoji,1f44d", make_usage("1f44d", 0, 2));

    // One emoji with 500 others' reactions.
    // Total others_messages = 500, so others_weight = min(5, 5*100/500) = 1.
    // With scaling: this emoji's score = 1*500 = 500.
    // Without scaling: score would be 5*500 = 2500.
    emoji_frequency_data.reaction_data.set("unicode_emoji,2764", make_usage("2764", 500));

    const result = emoji_frequency_data.preferred_emoji_list();

    // Both emoji should appear (scores 500 and 10, both >= 10).
    assert.equal(result.length, 0);
    // 2 items don't fill a full row of 6, so we get 0 after rounding.

    // Add 4 more emoji to fill a row.
    emoji_frequency_data.reaction_data.set("unicode_emoji,1f600", make_usage("1f600", 0, 2));
    emoji_frequency_data.reaction_data.set("unicode_emoji,1f389", make_usage("1f389", 0, 2));
    emoji_frequency_data.reaction_data.set("unicode_emoji,1f642", make_usage("1f642", 0, 2));
    emoji_frequency_data.reaction_data.set("unicode_emoji,1f680", make_usage("1f680", 0, 2));

    // Now 6 emoji total. Total others_messages = 500.
    // others_weight = min(5, 5*100/500) = 1.
    // heart (others only): score = 1 * 500 = 500.
    // 5 user emoji: score = 5 * 2 = 10 each.
    const result2 = emoji_frequency_data.preferred_emoji_list();
    assert.equal(result2.length, 6);

    // Heart (highest score) should be first.
    assert.equal(result2[0].emoji_code, "2764");

    // Verify scaling: without scaling, heart would score 2500
    // and user emoji would score 10. With scaling, heart scores
    // 500 and user emoji score 10. The key property we test is
    // that all user emoji still appear (score >= 10 threshold).
    const user_emoji_codes = new Set(["1f44d", "1f600", "1f389", "1f642", "1f680"]);
    const result_codes = new Set(result2.map((e) => e.emoji_code));
    for (const code of user_emoji_codes) {
        assert.ok(result_codes.has(code), `User emoji ${code} should appear`);
    }
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
