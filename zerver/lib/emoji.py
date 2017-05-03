from __future__ import absolute_import

import os
import re

from django.utils.translation import ugettext as _
from typing import Text, Tuple

from zerver.lib.bugdown import name_to_codepoint
from zerver.lib.request import JsonableError
from zerver.lib.upload import upload_backend
from zerver.models import Realm, UserProfile

def emoji_name_to_codepoint(realm, emoji_name):
    # type: (Realm, Text) -> Tuple[Text, bool]
    if emoji_name in set(realm.get_emoji().keys()):
        return realm.get_emoji()[emoji_name], True
    if emoji_name == 'zulip':
        return emoji_name, True
    if emoji_name in name_to_codepoint:
        return name_to_codepoint[emoji_name], False
    raise JsonableError(_("Emoji '%s' does not exist" % (emoji_name,)))

def check_valid_emoji(realm, emoji_name):
    # type: (Realm, Text) -> None
    emoji_name_to_codepoint(realm, emoji_name)

def check_emoji_admin(user_profile):
    # type: (UserProfile) -> None
    if user_profile.realm.add_emoji_by_admins_only and not user_profile.is_realm_admin:
        raise JsonableError(_("Must be a realm administrator"))

def check_valid_emoji_name(emoji_name):
    # type: (Text) -> None
    if re.match('^[0-9a-zA-Z.\-_]+(?<![.\-_])$', emoji_name):
        return
    raise JsonableError(_("Invalid characters in emoji name"))

def get_emoji_url(emoji_file_name, realm_id):
    # type: (Text, int) -> Text
    return upload_backend.get_emoji_url(emoji_file_name, realm_id)


def get_emoji_file_name(emoji_file_name, emoji_name):
    # type: (Text, Text) -> Text
    _, image_ext = os.path.splitext(emoji_file_name)
    return ''.join((emoji_name, image_ext))
