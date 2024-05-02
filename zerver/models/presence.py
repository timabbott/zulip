# https://github.com/typeddjango/django-stubs/issues/1698
# mypy: disable-error-code="explicit-override"

from typing import Optional

from django.db import models
from django.db.models import CASCADE
from django.utils.timezone import now as timezone_now

from zerver.models.clients import Client
from zerver.models.messages import AbstractEmoji
from zerver.models.realms import Realm
from zerver.models.users import UserProfile


class UserPresence(models.Model):
    """A record from the last time we heard from a given user on a given client.

    NOTE: Users can disable updates to this table (see UserProfile.presence_enabled),
    so this cannot be used to determine if a user was recently active on Zulip.
    The UserActivity table is recommended for that purpose.

    This is a tricky subsystem, because it is highly optimized.  See the docs:
      https://zulip.readthedocs.io/en/latest/subsystems/presence.html
    """

    user_profile = models.OneToOneField(UserProfile, on_delete=CASCADE, unique=True)

    # Realm is just here as denormalization to optimize database
    # queries to fetch all presence data for a given realm.
    realm = models.ForeignKey(Realm, on_delete=CASCADE)

    last_update_id = models.PositiveBigIntegerField(db_index=True, default=0)

    # The last time the user had a client connected to Zulip,
    # including idle clients where the user hasn't interacted with the
    # system recently (and thus might be AFK).
    last_connected_time = models.DateTimeField(default=timezone_now, db_index=True, null=True)
    # The last time a client connected to Zulip reported that the user
    # was actually present (E.g. via focusing a browser window or
    # interacting with a computer running the desktop app)
    last_active_time = models.DateTimeField(default=timezone_now, db_index=True, null=True)

    # The following constants are used in the presence API for
    # communicating whether a user is active (last_active_time recent)
    # or idle (last_connected_time recent) or offline (neither
    # recent).  They're no longer part of the data model.
    LEGACY_STATUS_ACTIVE = "active"
    LEGACY_STATUS_IDLE = "idle"
    LEGACY_STATUS_ACTIVE_INT = 1
    LEGACY_STATUS_IDLE_INT = 2

    class Meta:
        indexes = [
            models.Index(
                fields=["realm", "last_active_time"],
                name="zerver_userpresence_realm_id_last_active_time_1c5aa9a2_idx",
            ),
            models.Index(
                fields=["realm", "last_connected_time"],
                name="zerver_userpresence_realm_id_last_connected_time_98d2fc9f_idx",
            ),
            models.Index(
                fields=["realm", "last_update_id"],
                name="zerver_userpresence_realm_last_update_id_idx",
            ),
        ]

    @staticmethod
    def status_from_string(status: str) -> Optional[int]:
        if status == "active":
            return UserPresence.LEGACY_STATUS_ACTIVE_INT
        elif status == "idle":
            return UserPresence.LEGACY_STATUS_IDLE_INT

        return None


class PresenceSequence(models.Model):
    realm = models.OneToOneField(Realm, on_delete=CASCADE)
    last_update_id = models.PositiveBigIntegerField()


class UserStatus(AbstractEmoji):
    user_profile = models.OneToOneField(UserProfile, on_delete=CASCADE)

    timestamp = models.DateTimeField()
    client = models.ForeignKey(Client, on_delete=CASCADE)

    # Override emoji_name and emoji_code field of (AbstractReaction model) to accept
    # default value.
    emoji_name = models.TextField(default="")
    emoji_code = models.TextField(default="")

    status_text = models.CharField(max_length=255, default="")
