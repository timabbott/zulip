# Generated by Django 3.2.6 on 2021-09-07 01:06

from django.db import connection, migrations, models
from django.db.backends.postgresql.schema import DatabaseSchemaEditor
from django.db.migrations.state import StateApps
from psycopg2.sql import SQL

from zerver.lib.migrate import do_batch_update


def set_default_message_type(apps: StateApps, schema_editor: DatabaseSchemaEditor) -> None:
    with connection.cursor() as cursor:
        do_batch_update(
            cursor,
            "zerver_message",
            [SQL("type = 1")],
            batch_size=10000,
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("zerver", "0345_message_type_default"),
    ]

    operations = [
        migrations.RunPython(set_default_message_type, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name="archivedmessage",
            name="type",
            field=models.PositiveSmallIntegerField(choices=[(1, "Normal")], default=1),
        ),
        migrations.AlterField(
            model_name="message",
            name="type",
            field=models.PositiveSmallIntegerField(choices=[(1, "Normal")], default=1),
        ),
    ]
