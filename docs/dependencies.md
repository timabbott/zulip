# Provision and third-party dependencies

Zulip has well over 100 third-party dependencies, and it's important
to manage them carefully.  In this document, we discuss the various
classes of dependencies that Zulip has, and how we manage them.
Zulip's dependency management has some really nice properties:

* **Fast provisioning**.  When switching to a different commit in the
  Zulip project with the same dependencies, it takes under 10 seconds
  to re-provision a working Zulip development environment after
  switching.  If there are new dependencies, one only needs to wait to
  download the new ones, not all the pre-existing dependencies.
* **Consistent provisioning**.  Every time a Zulip development or
  production environment is provisioned/installed, it should end up
  using the exactly correct versions of all major dependencies.
* **Low maintenance burden**.  To the extent possible, we want to
  avoid manual work and keeping track of things that could be automated.

The goal of this document is to detail all of Zulip's third-party
dependencies and how we manage their versions.

## System packages

For the third-party services like Postgres, Redis, and RabbitMQ that
are documented in the
[architecture overview](architecture-overview.html), we rely on the
versions of those packages provided alongside the Linux distribution
on which Zulip is deployed (for Debian and Ubuntu, this means `apt`).
Since we don't control the versions of these dependencies, we avoid
relying on specific versions of these packages wherever possible.

The exact lista of `apt` packages are maintained in two major places:
* For production, in our puppet configuration, `puppet/zulip/`, using
  the `Package` and `SafePackage` directives.  For development, in
  `APT_DEPENDENCIES` in `tools/lib/provision.py`
* The packages needed to build a Zulip virtualenv, in
  `VENV_DEPENDENCIES`.  These are separate from the rest because we
  may need to install a virtualenv before running the more complex
  scripts that, in turn, install other dependencies.

We maintain a [personal package archive (PPA)][ppa] with some packages
unique to Zulip (e.g the `tsearch_extras` postgres extension) and
backported versions of other dependencies (e.g. `camo`, to fix a buggy
`init` script).  Our goal is to shrink or eliminate this PPA where
possible.

We also rely on the `pgroonga` PPA for the `pgroonga` postgres
extension, used by our [full-text search][full-text-search.html].

## Python packages

We manage Python packages via the Python-standard `requirements.txt`
system and virtualenvs, but there’s a number of interesting details
about how Zulip makes this system work well for us that are worth
highlighting.  The system is largely managed by the code in
`scripts/lib/setup_venv.py`

* **Using `pip` to manage dependencies**.  This is standard in the
  Python ecosystem, and means we only need to record a list of
  versions in a `requirements.txt` file to declare what we're using.
  Since we have a few different sets of files one might want to
  install, we maintain several `requirements.txt` format files in the
  `requirements/` directory (e.g. `dev.txt` for development,
  `prod.txt` for production, `docs.txt` for ReadTheDocs, etc.).  We
  use with `pip --no-deps` to ensure that we're declaring dependencies
  explicitly.
* **virtualenv with pinned versions**.  For a large application like
  Zulip, its valuable to ensure that we're always using consistent,
  predictabe versions of all of our Python dependencies.  To ensure
  this, we install our dependencies in a [virtualenv][] that contains
  only the packages and versions that Zulip needs, and we always pin
  exact versions of our dependencies in our `requirements.txt` files.
  And we always pin a precise version, not a minimum version, so that
  installing Zulip won't break if a dependency makes a buggy release.
  A side effect is that it's easy to debug problems caused by
  dependency upgrades, since we're always doing those upgrades with an
  explicit commit updating the `requirements/` directory.
* **Caching of virtualenvs and packages**.  In order to avoid doing
  unnecessary work, we maintain a cache of virtualenvs named by the
  hash of the relevant `requirements.txt` file.  That way, when
  re-provisioning a development environment or deploying a new
  production version with the same Python dependencies, no downloading
  or installation is required: we just use the same virtualenv.  When
  the only changes are upgraded versions, we'll use
  [virtualenv-clone][] to clone the most similar existing virtualenv
  and then just upgrade the packages needed, making small version
  upgrades extremely efficient.  And finally, we use `pip`'s built-in
  caching to ensure that a specific version of a specific package is
  only downloaded once.
* **Garbage-collecting caches**.  We have a tool,
  `scripts/lib/clean-venv-cache`, which will clean old cached
  `virtualenv`s that have not been used in a long time.  In
  production, the algorithm preserves recent virtualenvs as well as
  those in use by any current production deployment directory under
  `/home/zulip/deployments/`.  This helps ensure that Zulip doesn't
  leak massive amounts of disk.
* **Pinning versions of indirect depedendencies**.  We "pin" or "lock"
  the versions of our indirect depedencies files with
  `tools/update-locked-requirements` (powered by `pip compile`).  What
  this means it that we have some "source" requirements files, like
  `requirements/common.txt`, that declare the packages that Zulip
  depends on directly..  Those packages have their own recursive
  dependencies.  When adding or removing a dependency from Zulip, one
  simply edits the appropriate "source" requirements files, and then
  runs `tools/update-locked-requirements`.  That tool will use `pip
  compile` to generate the `prod_lock.txt` and `dev_lock.txt` files
  that explicitly declare versions of all of Zulip's recursive
  dependencies.  For indirect dependencies (i.e. dependencies not
  explicitly declared in the source requirements files), it provides
  helpful comments explaining which direct dependency meant we needed
  that indirect dependency.
* **Scripts**.  While Zulip's Django application and management
  commands automatically will find the main Zulip virtualenv, other
  miscellaneous scripts don't.  In theory, we could make everything
  import Django, but that would carry a significant performance
  penalty, since Django can take a long time to load.  Instead, we
  have a helpful library, `scripts/lib/setup_path_on_import.py`, which
  on import will put the currently running Python script into the
  Zulip virtualenv.

## JavaScript and other frontend packages

We use the same set of strategies described for Python dependencies
for most of our JavaScript dependencies.  Consult the above section
for details on the strategy; here we discuss how things differ.

* **node_modules directory with pinned versions**.  We store
  `node_modules` directories under `/srv/zulip-npm-cache` in a fashion
  analogous to the virtualenvs for Python packages.
* We use [yarn][], which talks to the [npm][] repository, to download
  most JavaScript dependencies.  We use the standard `package.json`
  file to declare our direct dependencies, both for development and
  production.  Yarn takes care of pinning the versions of indirect
  dependencies in the `yarn.lock` file.
* **Caching**.  We use `scripts/lib/node_cache.py` for managing our
  cached `node_modules` directories containing copies of our
  depedenencies.
* **Garbage-collecting caches**.  `scripts/lib/clean-npm-cache` is
  very similar to `clean-venv-cache`.
* `tools/update-prod-static`.  This process is discussed in detail in
  the [static asset pipeline](/front-end-build-process.html) article,
  but we don't use the `node_modules` directories directly in
  production.  Instead, static assets are compiled using our static
  asset pipeline and it is the compiled assets that are served
  directly to users.  As a result, we don't ship the `node_modules`
  directory in a Zulip production release tarball, which is a good
  thing, because doing so would more than double the size of a Zulip
  release tarball.

* **Checked-in packages** In contrast with Python, we have a few
JavaScript depedencies that we have copied into the main Zulip
repository under `static/third`, often with patches.  It is a project
goal to eliminate these checked-in versions of dependencies and
instead use versions obtained from the npm repositories.

## Node and Yarn

These are installed by `scripts/lib/install-node` (which in turn uses
the standard third-party `nvm` installer to download `node` and pin
its version) and `scripts/lib/third/install-yarn.sh` (the standard
installer for `yarn`, modified to support installing to a path that is
not the current user's home directory).

* `nvm` has its own system for installing each version of `node` at
its own path, which we use, though we install a `/usr/local/bin/node`
wrapper to access the desired version conveniently and efficiently
(`nvm` has a lot of startup overhead).
* `install-yarn.sh` is configured to install `yarn` at
  `/srv/zulip-yarn`.  We don't do anything special to try to manage
  multiple versions.

## Emoji data and other generated files

In this section, we discuss the other third-party dependenices,
generated code, and other files whose original primary source is not
the Zulip server repository, and how we provision and otherwise
maintain them.

### Emoji

Zulip uses the [iamcal emoji data package][iamcal] for its emoji data
and sprite sheets.  We download this dependency using `npm`, and then
have a tool, `tools/setup/build_emoji`, which reformats the emoji data
into the files under `static/generated/emoji`.  Those files are in
turn used by our markdown process and `tools/update-prod-static` to
make Zulip's emoji work.

Since processing emoji is a relatively expensive operation, as part of
optimizing provisioning, we use the same caching strategy for the
compiled emoji data as we use for virtualends and `node_modules`
directories, with `scripts/lib/clean-emoji-cache` responsible for
garbage-collection.  This caching and garbage-collection is required
because a correct emoji implementation involves over 1000 small image
files and a few large ones.  There is a more extended article one our
[emoji infrastructure](emoji.html).

### Translations data

Zulip's [translations infrastructure](translating.html) includes
several generated files, which we manage similar to our emoji, but
without the caching.  New translations data is downloaded from
Transifex and then compiled to generate both the production locale
files and also language data in `static/locale/language*.json` using
`manage.py compilemessages`.

### Pygments data

The list of languages supported by our syntax highlighting for
specific languages comes from `pygments`.
`tools/setup/build_pygments_data.py` is responsible for generating
`static/generated/pygments_data.js` so that our JavaScript markdown
processor has access to the supported list.

### The rest of provisioning

[virtualenv]: TODO
[virtualenv-clone]: TODO
[yarn]: TODO
[ppa]: TODO
[iamcal]: TODO
