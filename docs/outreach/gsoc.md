# GSoC project ideas

This page describes ideas you can use as a starting point for your project
proposal. If you have not done so yet, you should **start by reading our [guide on
how to apply](./apply.md)** to a Zulip outreach program. As noted in the guide:

> Your first priority during the contribution period should be figuring out how
> to become an effective Zulip contributor. Start developing your project proposal
> only once you have experience with iterating on your PRs to get them ready for
> integration. That way, you'll have a much better idea of what you want to work
> on and how much you can accomplish.

## Project size and difficulty

GSoC offers two project size options: 175 hours and 350 hours. We have
designed all our projects to have incremental milestones that can be
completed throughout the program. Consequently, all Zulip projects
described below are compatible with either project size. Of course,
the amount of progress you will be expected to make depends on whether
you are doing a 175-hour or 350-hour project.

We don't believe in labeling projects by difficulty, because the level of
difficulty is highly dependent on your particular skills. To help you find
a great project, we list the skills needed, and try to emphasize where strong
skills with particular tools are likely to be important for a given project.

## Focus areas

For 2023, we are particularly interested in GSoC contributors who have
strong skills at stack feature development, Typescript, visual design,
HTML/CSS, or performance optimization. So if you're an applicant with
those skills and are looking for an organization to join, we'd love to
talk to you!

The Zulip project has a huge surface area, so even when we're focused
on something, a large amount of essential work goes into other parts of
the project. Every area of Zulip could benefit from the work of a
contributor with strong programming skills, so don't feel discouraged if
the areas mentioned above are not your main strength.

## Project ideas by area

This section contains the seeds of project ideas; you will need to do
research on the Zulip codebase, read issues on GitHub, read
documentation, and talk with developers to put together a complete
project proposal. It's also fine to come up with your own project
ideas. As you'll see below, you can put together a great project
around one of the [area labels](https://github.com/zulip/zulip/labels)
on GitHub; each has a cluster of problems in one part of the Zulip
project that we'd love to improve.

### Full stack and web frontend focused projects

Code: [github.com/zulip/zulip -- Python, Django, JavaScript, and
CSS](https://github.com/zulip/zulip/).

- Help migrate our JavaScript codebase to Typescript. Zulip is in the
  process of porting the main web app JavaScript codebase to
  TypeScript; at present we've done much of the necessary tooling
  setup, and about 8% of lines have been migrated (mostly in libraries
  used widely); the goal for this project will be to get that to more
  like 75%. [This topic on chat.zulip.org][typescript-migration] is a
  good place to coordinate work on this project. Multiple students are
  possible; 175 and 350 hours; difficult. **Skills required**:
  TypeScript and refactoring expertise; we're specifically interested
  in students who are a type theory nerd and are invested in writing
  types precisely and checking their work carefully. Experts: Zixuan
  James Li, Priyank Patel, Anders Kaseorg.

[typescript-migration]: https://chat.zulip.org/#narrow/stream/6-frontend/topic/typescript.20migration

- Contribute to Zulip's [migration to user groups for
  permissions][user-group-permissions]. This migration, which is
  intended to replace every permission setting in Zulip that currently
  allows users to select which roles (admin, moderator, etc.) have
  permission to do something with Zulip's "user groups", making it
  much more customizable. This is very important for large
  organizations using Zulip, both businesses and open source
  projects. Much of the basic design, API structure, and scaffolding
  is complete, but there is a lot of work that remains to complete
  this vision. The project can likely support a couple students; there
  is considerable work to be done on the settings UI, both for user
  groups and for stream and organization-level settings, dozens of
  existing settings to migrate and many new settings that users have
  long requested that we've delayed adding in order to avoid having to
  migrate them. 175 or 350 hours; moderate difficulty. **Skills
  required**: Python, JavaScript, and CSS. Attention to detail around
  code reuse/duplication, thoughtful testing, and splitting large
  migrations into reviewable chunks.

  Experts: Purushottam Tiwari, Sahil Batra

[user-group-permissions]: https://github.com/zulip/zulip/issues/19525

- **Add an inbox view** to the web app. We intend to add a new
  optional home screen for the Zulip web application that works like
  the mobile app's home screen -- showing just topics containing
  unread messages, in an organized fashion, in the web app's center
  pane. Details are available in the
  [issue](https://github.com/zulip/zulip/issues/22189) and [draft pull
  request](https://github.com/zulip/zulip/pull/22408) with prototyping
  towards this done in GSoC 2022; the goal for this project would be
  to extract preparatory refactoring changes to make it nicely
  parallel to the similar Recent Conversations panel so that it can be
  merged in a maintainable fashion, work with the community to
  integrate those changes, complete the inbox feature through being
  merged, and then spend the remainder of the summer polishing it. 175
  or 350 hours; moderate difficulty. **Skills required**: JavaScript,
  CSS, and reading and understanding a complex code path.

  Experts: Aman Agrawal, Shlok Patel

- **Extended notification settings**. Extend Zulip's powerful
  notification settings model to support additional configuration
  options. The top priorities in this area are [unmuting topics in
  muted streams](https://github.com/zulip/zulip/issues/2517) and
  [Following a topic](https://github.com/zulip/zulip/issues/6027);
  these are two of the 5 most requested features for the Zulip project
  overall. For this project, one will likely want to start with some
  simpler issues in the [notifications(messages)
  area][notifications-messages] in order to get familiary with the
  code paths in question. There is enough to do in this project that
  we could have two students working in this area. 175 or 350 hours;
  moderate difficulty. **Skills required**: Python and JavaScript,
  with a bit of CSS, database design, and other aspects of full-stack
  feature development. Attention to detail, thinking through subtle
  corner cases, designing good abstractions to help ensure
  correctness, and writing tests to verify correct behavior in them
  will be an important part of this work.

  Experts: Abhijeet Bodas, Ryan Rehman.

[notifications-messages]: https://github.com/zulip/zulip/labels/area%3A%20notifications%20%28messages%29

- **Cluster of priority features**. Implement a cluster of new full
  stack features for Zulip. The [high priority
  label](https://github.com/zulip/zulip/issues?q=is%3Aissue+is%3Aopen+label%3A%22priority%3A+high%22)
  documents hundreds of issues that we've identified as important to
  the project. A great project can be 3-5 significant features around
  a theme (often, but not necessarily, an [area
  label](https://github.com/zulip/zulip/labels); the goal will be to
  implement and get fully merged a cluster of features with a
  meaningful impact on the project. Zulip has a lot of half-finished
  PRs; so some features might be completed by reading, understanding,
  rebasing, and reviving an old/existing pull request. 175 or 350
  hours; difficulty will vary. Experts and skills depend on the
  features; Tim Abbott will help you select an appropriate cluster
  once we've gotten to know you and your strengths through getting
  involved in the project.

- Zulip's [REST API documentation](https://zulip.com/api), which is an
  important resource for any organization integrating with Zulip as
  well as the developers of our API clients. Zulip has a [nice
  framework](../documentation/api.md) for writing API documentation
  built by past GSoC students based on the OpenAPI standard with
  built-in automated tests of the data both the Python and curl
  examples. However, the documentation isn't yet what we're hoping
  for: there are a few dozen endpoints that are missing, several of
  which are quite important, the visual design isn't perfect
  (especially for e.g. `GET /events`), many template could be deleted
  with a bit of framework effort, etc. See the [API docs area
  label][api-docs-area] for some specific projects in the area; and
  `git grep pending_endpoints` to find the list of endpoints that need
  documentation and their priorities. Our goal for the summer is for
  1-2 students to resolve all open issues related to the REST API
  documentation. 175 or 350 hours; difficulty easy or medium. **Skill
  required**: Python programming. Expertise with reading documentation
  and English writing are valuable, and product thinking about the
  experience of using third-party APIs is very helpful. Expert: Lauryn
  Menard.

[api-docs-area]: https://github.com/zulip/zulip/issues?q=is%3Aopen+is%3Aissue+label%3A%22area%3A+documentation+%28api+and+integrations%29%22

- Implement important full-stack features for open source projects
  using Zulip, including [default stream
  groups](https://github.com/zulip/zulip/issues/13670) and
  improvements to the upcoming [public
  access](https://github.com/zulip/zulip/issues/13172)
  feature. Experts: Tim Abbott, Aman Agrawal. Many of these issues
  have open PRs with substantial work towards the goal, but each of
  them is likely to have dozens of adjacent or follow-up tasks. 175 or
  350 hours; easy or medium. The most important skill for this work is
  carefully thinking through and verifying changes that affect
  multiple configurations.

- Fill in gaps, fix bugs, and improve the framework for Zulip's
  library of native integrations. We have about 120 native
  integrations, but there's more that would be valuable to add, and
  several extensions to the framework that would dramatically improve
  the user experience of using these, such as being able to do
  callbacks to third-party services like Stripe to display more
  user-friendly notifications. The [the integrations label on
  GitHub](https://github.com/zulip/zulip/labels/area%3A%20integrations)
  lists some of the priorities here (many of which are great
  preparatory projects). 175 or 350 hours; medium difficulty with
  various possible difficult extensions. **Skills required**: Strong
  Python experience, will to install and do careful manual testing of
  third-party products. Fluent English, usability sense and/or
  technical writing skills are all pluses. Expert: Zixuan Li.

- Optimize performance and scalability, either for the web frontend or
  the server. Zulip is already one of the faster web apps out there,
  but there are a bunch of ideas for how to make it substantially
  faster. This is likely a particularly challenging project to do
  well, since there are a lot of subtle interactions to
  understand. 175 or 350 hours; difficult. **Skill recommended**:
  Strong debugging, communication, and code reading skills are most
  important here. JavaScript experience; some Python/Django
  experience, some skill with CSS, ideally experience using the Chrome
  Performance profiling tools (but you can pick this up as you go) can
  be useful depending on what profiling shows. Our [backend
  scalability design doc](../subsystems/performance.md) and the
  [performance label][perf-label] may be helpful reading for the
  backend part of this. Experts: Tim Abbott, Yash RE.

[perf-label]: https://github.com/zulip/zulip/labels/area%3A%20performance

- Make Zulip integrations easier for nontechnical users to set up.
  This includes adding a backend permissions system for managing bot
  permissions (and implementing the enforcement logic), adding an
  OAuth system for presenting those controls to users, as well as
  making the /integrations page UI have buttons to create a bot,
  rather than sending users to the administration page. 175 or 350
  hours; easy to difficult depending on scope. **Skills recommended**:
  Strong Python/Django; JavaScript, CSS, and design sense
  helpful. Understanding of implementing OAuth providers, e.g. having
  built a prototype with [the Django OAuth
  toolkit](https://django-oauth-toolkit.readthedocs.io/en/latest/)
  would be great to demonstrate as part of an application. The [Zulip
  integration writing guide](../documentation/integrations.md) and
  [integration documentation](https://zulip.com/integrations/) are
  useful materials for learning about how things currently work, and
  [the integrations label on
  GitHub](https://github.com/zulip/zulip/labels/area%3A%20integrations)
  has a bunch of good starter issues to demonstrate your skills if
  you're interested in this area. Expert: Zixuan James Li.

- Visual and user experience design work on the core Zulip web UI.
  We're particularly excited about students who are interested in
  making our CSS clean and readable as part of working on the UI; we
  are working on a major redesign and have a lot of plans that we
  believe will substantially improve the application but require care
  and determination to implement and integrate. 175 or 350 hours;
  medium to difficult. **Skills required**: Design, HTML and CSS
  skills; most important is the ability to carefully verify that one's
  changes are correct and will not break other parts of the app;
  design changes are very rewarding since they are highly user-facing,
  but that also means there is a higher bar for correctness and
  reviewability for one's work. A great application would include PRs
  making small, clean improvements to the Zulip UI (whether logged-in
  or logged-out pages). Experts: Aman Agrawal, Alya Abbott.

- Improve the UI and visual design of the existing Zulip settings and
  administration pages while fixing bugs and adding new settings. The
  pages have improved a great deal during recent GSoCs, but because
  they have a ton of surface area, there's a lot to do. You can get a
  great sense of what needs to be done by playing with the
  settings/administration/streams overlays in a development
  environment. You can get experience working on the subsystem by
  working on some of [our open settings/admin
  issues][all-settings-issues]. 175
  to 350 hours; easy to medium. **Skills recommended**: JavaScript,
  HTML, CSS, and an eye for visual design. Expert: Sahil Batra.

  [all-settings-issues]: https://github.com/zulip/zulip/issues?q=is%3Aopen+is%3Aissue+label%3A%22area%3A+settings+%28admin%2Forg%29%22%2C%22area%3A+settings+%28user%29%22%2C%22area%3A+stream+settings%22%2C%22area%3A+settings+UI%22

- Build out the administration pages for Zulip to add new permissions
  and other settings more features that will make Zulip better for
  larger organizations. We get constant requests for these kinds of
  features from Zulip users. The Zulip bug tracker has plentiful open
  issues( [settings
  (admin/org)](https://github.com/zulip/zulip/labels/area%3A%20settings%20%28admin%2Forg%29),
  [settings
  UI](https://github.com/zulip/zulip/labels/area%3A%20settings%20UI),
  [settings
  (user)](https://github.com/zulip/zulip/labels/area%3A%20settings%20%28user%29),
  [stream
  settings](https://github.com/zulip/zulip/labels/area%3A%20stream%20settings)
  ) in the space of improving the Zulip administrative UI. Many are
  little bite-size fixes in those pages, which are great for getting a
  feel for things, but a solid project here would be implementing
  several of the major missing features as full-stack development
  projects. A particular focus this summer will be extending most
  permissions settings to use a new groups-based model. 350 or 175
  hours; medium difficulty. **Skills recommended**: A good mix of
  Python/Django and HTML/CSS/JavaScript skill is ideal. The system for
  adding new features is [well
  documented](../tutorials/new-feature-tutorial.md). Expert: Sahil
  Batra.

- Work on Zulip's development and testing infrastructure. Zulip is a
  project that takes great pride in building great tools for
  development, but there's always more to do to make the experience
  delightful. Significantly, about 10% of Zulip's open issues are
  ideas for how to improve the project's contributor experience, and
  are [in](https://github.com/zulip/zulip/labels/area%3A%20tooling)
  [these](https://github.com/zulip/zulip/labels/area%3A%20testing-coverage)
  [four](https://github.com/zulip/zulip/labels/area%3A%20testing-infrastructure)
  [labels](https://github.com/zulip/zulip/labels/area%3A%20provision)
  for tooling improvements.

  This is a somewhat unusual project, in that it would likely consist
  of dozens of small improvements to the overall codebase, but this
  sort of work has a huge impact on the experience of other Zulip
  developers and thus the community as a whole (project leader Tim
  Abbott spends more time on the development experience than any other
  single area).

  175 or 350 hours; difficult.

  **Skills required**: Python, some DevOps, and a passion for checking
  your work carefully. A strong applicant for this will have
  completed several projects in these areas.

  Experts: Tim Abbott

- Write more API client libraries in more languages, or improve the
  ones that already exist (in
  [python](https://github.com/zulip/python-zulip-api),
  [JavaScript](https://github.com/zulip/zulip-js),
  [PHP](https://packagist.org/packages/mrferos/zulip-php), and
  [Haskell](https://hackage.haskell.org/package/hzulip)). The
  JavaScript bindings are a particularly high priority, since they are
  a project that hasn't gotten a lot of attention since being adopted
  from its original author, and we'd like to convert them to
  Typescript. 175 or 350 hours; medium difficulty. **Skills
  required**: Experience with the target language and API
  design. Expert: Depends on language.

### Mobile apps

Code:
[React Native mobile app](https://github.com/zulip/zulip-mobile).
Experts: Greg Price, Chris Bobbe.

We're currently exploring rewriting Zulip's mobile apps, which are
currently implemented using React Native, using Flutter. See [this
thread][flutter-thread] for details.

If you are a Flutter expert and excited about getting involved, feel
free to introduce yourself in #mobile. But because we are still
getting that project and its development processes organized, we
expect we will not be accepting any GSoC students to contribute to the
Zulip mobile apps for GSoC 2023.

[flutter-thread]: https://chat.zulip.org/#narrow/stream/2-general/topic/Flutter

### Electron desktop app

Code:
[Our cross-platform desktop app written in JavaScript on Electron](https://github.com/zulip/zulip-desktop).
Experts: Anders Kaseorg

- Contribute to our [Electron-based desktop client
  application](https://github.com/zulip/zulip-desktop). There's plenty
  of feature/UI work to do, but focus areas for us include things to
  (1) improve the release process for the app, using automated
  testing, TypeScript, etc. and (2) polish the UI. Browse the open
  issues and get involved! 175 or 350 hours. This is a difficult
  project because it is important user-facing code without good
  automated testing, so the bar for writing high quality, revieable
  PRs that convince others your work is correct is high.

**Skills required**: JavaScript experience, Electron experience. You
can learn electron as part of your application!

Good preparation for desktop app projects is to (1) try out the app
and see if you can find bugs or polish problems lacking open issues
and report them and (2) fix some polish issues in either the Electron
app or the Zulip web frontend (which is used by the electron app).

- Prototype a next generation Zulip desktop app implemented using the
  Tauri Rust-based framework. Tauri is a promising new project that we
  believe is likely a better technical direction for client
  applications than Electron for desktop apps for security and
  resource consumption reasons. The goal of this project would be to
  build a working prototype to evaluate to what extent Tauri is a
  viable platform for us to migrate the Zulip desktop app to. 350
  hours only; difficult. **Skill required**: Ability to learn quickly.

### Terminal app

Code: [Zulip Terminal](https://github.com/zulip/zulip-terminal)
Experts: Aman Agrawal, Neil Pilgrim.

- Work on Zulip Terminal, the official terminal client for Zulip.
  zulip-terminal is already a basic usable client, but it needs a lot
  of work to approach the web app's quality level. We would be happy
  to accept multiple strong students to work on this project. Our goal
  for this summer is to improve its quality enough that we can upgrade
  it from an alpha to an advertised feature. 175 or 350 hours; medium
  difficulty. **Skills required**: Python 3 development skills, good
  communication and project management skills, good at reading code
  and testing.

### Archive tool

Code: [zulip-archive](https://github.com/zulip/zulip-archive)
Experts: Rein Zustand, Steve Howell

- Work on zulip-archive, which provides a Google-indexable read-only
  archive of Zulip conversations. The issue tracker for the project
  has a great set of introductory/small projects; the overall goal is
  to make the project super convenient to use for our OSS
  communities. 175 or 350 hours; medium difficulty.
  **Skills useful**: Python 3, reading feedback from users, CSS,
  GitHub Actions.
