# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db.backends.postgresql_psycopg2.schema import DatabaseSchemaEditor
from django.db.migrations.state import StateApps
from django.db import migrations

from django.utils.timezone import now as timezone_now

def backfill_subscription_log_events(apps, schema_editor):
    # type: (StateApps, DatabaseSchemaEditor) -> None
    migration_time = timezone_now()
    RealmAuditLog = apps.get_model('zerver', 'RealmAuditLog')
    Subscription = apps.get_model('zerver', 'Subscription')

    for sub in Subscription.objects.filter(recipient__type=2):
        RealmAuditLog.objects.create(realm=sub.user_profile.realm,
                                     modified_user=sub.user_profile,
                                     modified_stream_id=sub.recipient.type_id,
                                     event_type='subscription_created',
                                     event_time=migration_time,
                                     backfilled=True)

    migration_time_for_deactivation = timezone_now()
    for sub in Subscription.objects.filter(recipient__type=2,
                                           active=False):
        RealmAuditLog.objects.create(realm=sub.user_profile.realm,
                                     modified_user=sub.user_profile,
                                     modified_stream_id=sub.recipient.type_id,
                                     event_type='subscription_deactivated',
                                     event_time=migration_time_for_deactivation,
                                     backfilled=True)

def reverse_code(apps, schema_editor):
    # type: (StateApps, DatabaseSchemaEditor) -> None
    RealmAuditLog = apps.get_model('zerver', 'RealmAuditLog')
    RealmAuditLog.objects.filter(event_type='subscription_created').delete()
    RealmAuditLog.objects.filter(event_type='subscription_deactivated').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0091_realm_allow_edit_history'),
    ]

    operations = [
        migrations.RunPython(backfill_subscription_log_events,
                             reverse_code=reverse_code),
    ]
