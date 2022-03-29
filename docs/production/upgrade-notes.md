# Upgrade notes

#### Upgrade notes for 5.0

- This release contains a migration, `0009_confirmation_expiry_date_backfill`,
  that can take several minutes to run on a server with millions of
  messages of history.
- The `TERMS_OF_SERVICE` and `PRIVACY_POLICY` settings have been
  removed in favor of a system that supports additional policy
  documents, such as a code of conduct. See the [updated
  documentation](../production/settings.md) for the new system.

#### Upgrade notes for 4.0

- Changed the Tornado service to use 127.0.0.1:9800 instead of
  127.0.0.1:9993 as its default network address, to simplify support
  for multiple Tornado processes. Since Tornado only listens on
  localhost, this change should have no visible effect unless another
  service is using port 9800.
- Zulip's top-level puppet classes have been renamed, largely from
  `zulip::foo` to `zulip::profile::foo`. Configuration referencing
  these `/etc/zulip/zulip.conf` will be automatically updated during
  the upgrade process, but if you have a complex deployment or you
  maintain `zulip.conf` is another system (E.g. with the [manual
  configuration][docker-zulip-manual] option for
  [docker-zulip][docker-zulip]), you'll want to manually update the
  `puppet_classes` variable.
- Zulip's supervisord configuration now lives in `/etc/supervisor/conf.d/zulip/`
- Consider enabling [Smokescreen][smokescreen]
- Private streams can no longer be default streams (i.e. the ones new
  users are automatically added to).
- New `scripts/start-server` and `scripts/stop-server` mean that
  one no longer needs to use `supervisorctl` directly for these tasks.
- As this is a major release, we recommend [carefully updating the
  inline documentation in your
  `/etc/zulip/settings.py`][update-settings-docs]. Notably, we rewrote the
  template to be better organized and more readable in this release.
- The web app will now display a warning in the UI if the Zulip server
  has not been upgraded in more than 18 months.
  template to be better organized and more readable.
- The next time users log in to Zulip with their password after
  upgrading to this release, they will be logged out of all active
  browser sessions (i.e. the web and desktop apps). This is a side
  effect of improved security settings (increasing the minimum entropy
  used when salting passwords from 71 bits to 128 bits).
- We've removed the partial Thumbor integration from Zulip. The
  Thumbor project appears to be dead upstream, and we no longer feel
  comfortable including it in Zulip from a security perspective. We
  hope to introduce a fully supported thumbnailing integration in our next
  major release.

[docker-zulip-manual]: https://github.com/zulip/docker-zulip#manual-configuration
[smokescreen]: ../production/deployment.md#customizing-the-outgoing-http-proxy
[update-settings-docs]: ../production/upgrade-or-modify.md#updating-settingspy-inline-documentation

#### Upgrade notes for 3.0

- Logged in users will be logged out during this one-time upgrade to
  transition them to more secure session cookies.
- This release contains dozens of database migrations, but we don't
  anticipate any of them being particularly expensive compared to
  those in past major releases.
- Previous versions had a rare bug that made it possible to create two
  user accounts with the same email address, preventing either from
  logging in. A migration in this release adds a database constraint
  that will fix this bug. The new migration will fail if any such
  duplicate accounts already exist; you can check whether this will
  happen be running the following in a [management shell][manage-shell]:
  ```python
  from django.db.models.functions import Lower
  UserProfile.objects.all().annotate(email_lower=Lower("delivery_email"))
      .values('realm_id', 'email_lower').annotate(Count('id')).filter(id__count__gte=2)
  ```
  If the command returns any accounts, you need to address the
  duplicate accounts before upgrading. Zulip Cloud only had two
  accounts affected by this bug, so we expect the vast majority of
  installations will have none.
- This release switches Zulip to install PostgreSQL 12 from the upstream
  PostgreSQL repository by default, rather than using the default
  PostgreSQL version included with the operating system. Existing Zulip
  installations will continue to work with PostgreSQL 10; this detail is
  configured in `/etc/zulip/zulip.conf`. We have no concrete plans to
  start requiring PostgreSQL 12, though we do expect it to improve
  performance. Installations that would like to upgrade can follow
  [our new PostgreSQL upgrade guide][postgresql-upgrade].
- The format of the `JWT_AUTH_KEYS` setting has changed to include an
  [algorithms](https://pyjwt.readthedocs.io/en/latest/algorithms.html)
  list: `{"subdomain": "key"}` becomes
  `{"subdomain": {"key": "key", "algorithms": ["HS256"]}}`.
- Added a new organization owner permission above the previous
  organization administrator. All existing organization
  administrators are automatically converted into organization owners.
  Certain sensitive administrative settings are now only
  editable by organization owners.
- The changelog now has a section that makes it easy to find the
  Upgrade notes for all releases one is upgrading across.

[manage-shell]: ../production/management-commands.md#managepy-shell
[postgresql-upgrade]: ../production/upgrade-or-modify.md#upgrading-postgresql

#### Upgrade notes for 2.1.5

Administrators of servers originally installed with Zulip 1.9 or older
should audit for unexpected [organization
administrators][audit-org-admin] following this upgrade, as it is
possible CVE-2020-14215 caused a user to incorrectly join as an
organization administrator in the past. See the release blog post for
details.

[audit-org-admin]: https://zulip.com/help/change-a-users-role

#### Upgrade notes for 2.1.0

- The defaults for Zulip's now beta inline URL preview setting have changed.
  Previously, the server-level `INLINE_URL_EMBED_PREVIEW` setting was
  disabled, and organization-level setting was enabled. Now, the
  server-level setting is enabled by default, and the organization-level
  setting is disabled. As a result, organization administrators can
  configure this feature entirely in the UI. However, servers that had
  previously [enabled previews of linked
  websites](https://zulip.com/help/allow-image-link-previews) will
  lose the setting and need to re-enable it.
- We rewrote the Google authentication backend to use the
  `python-social-auth` system we use for other third-party
  authentication systems. For this release, the old variable names
  still work, but users should update the following setting names in
  their configuration as we will desupport the old names in a future
  release:
  - In `/etc/zulip/zulip-secrets.conf`, `google_oauth2_client_secret`
    is now called with `social_auth_google_secret`.
  - In `/etc/zulip/settings.py`, `GOOGLE_OAUTH2_CLIENT_ID` should be
    replaced with `SOCIAL_AUTH_GOOGLE_KEY`.
  - In `/etc/zulip/settings.py`, `GoogleMobileOauth2Backend` should
    be replaced with called `GoogleAuthBackend`.
- Installations using Zulip's LDAP integration without
  `LDAP_APPEND_DOMAIN` will need to configure two new settings telling
  Zulip how to look up a user in LDAP given their email address:
  `AUTH_LDAP_REVERSE_EMAIL_SEARCH` and `AUTH_LDAP_USERNAME_ATTR`. See
  the [LDAP configuration
  instructions](../production/authentication-methods.md#ldap-including-active-directory)
  for details. You can use the usual `manage.py query_ldap` method to
  verify whether your configuration is working correctly.
- The Zulip web and desktop apps have been converted to directly count
  all unread messages, replacing an old system that just counted the
  (recent) messages fully fetched by the web app. This one-time
  transition may cause some users to notice old messages that were
  sent months or years ago "just became unread". What actually
  happened is the user never read these messages, and the Zulip web app
  was not displaying that. Generally, the fix is for users to simply
  mark those messages as read as usual.
- Previous versions of Zulip's installer would generate the secrets
  `local_database_password` and `initial_password_salt`. These
  secrets don't do anything, as they only modify behavior of a Zulip
  development environment. We recommend deleting those lines from
  `/etc/zulip/zulip-secrets.conf` when you upgrade to avoid confusion.
- This release has a particularly expensive database migration,
  changing the `UserMessage.id` field from an `int` to a `bigint` to
  support more than 2 billion message deliveries on a Zulip server.
  It runs in 2 phases: A first migration that doesn't require the
  server to be down (which took about 4 hours to process the 250M rows
  on chat.zulip.org, and a second migration that does require downtime
  (which took about 60 seconds for chat.zulip.org). You can check the
  number of rows for your server with `UserMessage.objects.count()`.

  We expect that most Zulip servers can happily just use the normal
  upgrade process with a few minutes of downtime. Zulip servers with
  over 1M messages may want to first upgrade to [this
  commit](https://github.com/zulip/zulip/commit/b008515d63841e1c0a16ad868d3d67be3bfc20ca)
  using `upgrade-zulip-from-git`, following the instructions to avoid
  downtime, and then upgrade to the new release.

#### Upgrade notes for 2.0.0

- This release adds support for submitting basic usage statistics to
  help the Zulip core team. This feature can be enabled only if a server
  is using the [Mobile Push Notification Service][mpns-statistics-docs],
  and is enabled by default in that case. To disable it, set
  `SUBMIT_USAGE_STATISTICS = False` in `/etc/zulip/settings.py`.

[mpns-statistics-docs]: ../production/mobile-push-notifications.md#submitting-statistics

#### Upgrade notes for 1.9.0

- Zulip 1.9 contains a significant database migration that can take
  several minutes to run. The upgrade process automatically minimizes
  disruption by running this migration first, before beginning the
  user-facing downtime. However, if you'd like to watch the downtime
  phase of the upgrade closely, we recommend
  [running them first manually](https://zulip.readthedocs.io/en/1.9.0/production/expensive-migrations.html)
  as well as the usual trick of doing an apt upgrade first.

#### Upgrade notes for 1.8.0

This major release has no special upgrade notes.

#### Upgrade notes for 1.7.0

- Zulip 1.7 contains some significant database migrations that can
  take several minutes to run. The upgrade process automatically
  minimizes disruption by running these first, before beginning the
  user-facing downtime. However, if you'd like to watch the downtime
  phase of the upgrade closely, we recommend
  [running them first manually](https://zulip.readthedocs.io/en/1.9.0/production/expensive-migrations.html)
  as well as the usual trick of doing an apt upgrade first.

- We've removed support for an uncommon legacy deployment model where
  a Zulip server served multiple organizations on the same domain.
  Installs with multiple organizations now require each organization
  to have its own subdomain.

  This change should have no effect for the vast majority of Zulip
  servers that only have one organization. If you manage a server
  that hosts multiple organizations, you'll want to read [our guide on
  multiple organizations](../production/multiple-organizations.md).

- We simplified the configuration for our password strength checker to
  be much more intuitive. If you were using the
  `PASSWORD_MIN_ZXCVBN_QUALITY` setting,
  [it has been replaced](https://github.com/zulip/zulip/commit/a116303604e362796afa54b5d923ea5312b2ea23) by
  the more intuitive `PASSWORD_MIN_GUESSES`.
