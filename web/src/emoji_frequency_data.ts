import assert from "minimalistic-assert";

import type {Message} from "./message_store.ts";
import {current_user} from "./state_data.ts";
import type * as typeahead from "./typeahead.ts";

const EMOJI_PICKER_ROW_LENGTH = 6;
const MAX_FREQUENTLY_USED_EMOJIS = 5 * EMOJI_PICKER_ROW_LENGTH;
const CURRENT_USER_REACTION_WEIGHT = 5;
const POPULAR_EMOJIS_BONUS_WEIGHT = 12;

type ReactionUsage = {
    emoji_code: string;
    emoji_type: string;
    message_ids: Set<number>;
    current_user_reacted_message_ids: Set<number>;
};

// Exported for testing.
export const reaction_data = new Map<string, ReactionUsage>();
export const popular_emoji_ids = new Set<string>();

function compute_score(emoji_id: string, reaction_usage: ReactionUsage): number {
    const your_messages = reaction_usage.current_user_reacted_message_ids.size;
    const others_messages = reaction_usage.message_ids.size - your_messages;
    const popular_bonus = popular_emoji_ids.has(emoji_id) ? POPULAR_EMOJIS_BONUS_WEIGHT : 0;
    return CURRENT_USER_REACTION_WEIGHT * your_messages + others_messages + popular_bonus;
}

export function preferred_emoji_list(): typeahead.EmojiItem[] {
    const scored_emojis = [...reaction_data.entries()].map(([emoji_id, usage]) => ({
        emoji_id,
        usage,
        score: compute_score(emoji_id, usage),
    }));
    scored_emojis.sort((a, b) => b.score - a.score);

    const top_frequently_used_emojis = [];
    for (const {usage, score} of scored_emojis) {
        if (top_frequently_used_emojis.length === MAX_FREQUENTLY_USED_EMOJIS || score < 10) {
            break;
        }
        top_frequently_used_emojis.push({
            emoji_type: usage.emoji_type,
            emoji_code: usage.emoji_code,
        });
    }

    const num_frequently_used_emojis =
        Math.floor(top_frequently_used_emojis.length / EMOJI_PICKER_ROW_LENGTH) *
        EMOJI_PICKER_ROW_LENGTH;

    return top_frequently_used_emojis.slice(0, num_frequently_used_emojis);
}

export function handle_reaction_addition_on_message(info: {
    message_id: number;
    emoji_id: string;
    emoji_code: string;
    emoji_type: string;
    is_me: boolean;
}): void {
    const {message_id, emoji_id, emoji_code, emoji_type, is_me} = info;

    if (!reaction_data.has(emoji_id)) {
        reaction_data.set(emoji_id, {
            emoji_code,
            emoji_type,
            message_ids: new Set(),
            current_user_reacted_message_ids: new Set(),
        });
    }

    const reaction_usage = reaction_data.get(emoji_id);
    assert(reaction_usage !== undefined);

    reaction_usage.message_ids.add(message_id);
    if (is_me) {
        reaction_usage.current_user_reacted_message_ids.add(message_id);
    }
}

export function handle_reaction_removal_on_message(info: {
    emoji_id: string;
    message_id: number;
    is_me: boolean;
    emoji_still_on_message: boolean;
}): void {
    const {emoji_id, message_id, is_me, emoji_still_on_message} = info;

    const reaction_usage = reaction_data.get(emoji_id);
    if (reaction_usage === undefined) {
        return;
    }

    if (is_me) {
        reaction_usage.current_user_reacted_message_ids.delete(message_id);
    }
    if (!emoji_still_on_message) {
        reaction_usage.message_ids.delete(message_id);
    }
}

export function remove_message_reactions(info: {message_id: number; emoji_ids: string[]}): void {
    const {message_id, emoji_ids} = info;

    for (const emoji_id of emoji_ids) {
        const reaction_usage = reaction_data.get(emoji_id);
        if (reaction_usage === undefined) {
            continue;
        }
        reaction_usage.message_ids.delete(message_id);
        reaction_usage.current_user_reacted_message_ids.delete(message_id);
    }
}

export function initialize_data(info: {
    messages: Message[];
    popular_emojis: typeahead.EmojiItem[];
}): void {
    const {messages, popular_emojis} = info;

    for (const {emoji_code, emoji_type} of popular_emojis) {
        const emoji_id = [emoji_type, emoji_code].join(",");
        popular_emoji_ids.add(emoji_id);
        if (!reaction_data.has(emoji_id)) {
            reaction_data.set(emoji_id, {
                emoji_code,
                emoji_type,
                message_ids: new Set(),
                current_user_reacted_message_ids: new Set(),
            });
        }
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        assert(message !== undefined);
        const message_reactions = message.clean_reactions.values();
        for (const emoji of message_reactions) {
            const emoji_id = emoji.local_id;
            if (!reaction_data.has(emoji_id)) {
                reaction_data.set(emoji_id, {
                    emoji_code: emoji.emoji_code,
                    emoji_type: emoji.reaction_type,
                    message_ids: new Set(),
                    current_user_reacted_message_ids: new Set(),
                });
            }
            const reaction = reaction_data.get(emoji_id);
            assert(reaction !== undefined);
            reaction.message_ids.add(message.id);

            if (emoji.user_ids.includes(current_user.user_id)) {
                reaction.current_user_reacted_message_ids.add(message.id);
            }
        }
    }
}
