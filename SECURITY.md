# Security Policy

## Supported versions

Security fixes are provided for the latest release line only. Please upgrade
to the most recent release before reporting an issue.

| Version | Supported |
| ------- | --------- |
| 0.5.x   | Yes       |
| < 0.5   | No        |

## Reporting a vulnerability

Please **do not** report security vulnerabilities in public issues, pull
requests or discussions.

Report them privately using GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability):
open the repository's **Security** tab and choose **Report a vulnerability**.

Please include:

- a description of the issue and its potential impact,
- steps to reproduce, or a proof of concept,
- the affected version or commit, and your browser and OS if relevant.

## What to expect

- We aim to acknowledge your report within **7 days**.
- We will keep you informed as we investigate and work on a fix.
- Once a fix is available we will publish an advisory and credit you, unless
  you prefer to stay anonymous.

Please give us reasonable time to fix the issue before disclosing it publicly.

## Scope

Spec Composer is a client-side application: projects, brand kits and uploaded
images are stored in the browser and there is no account system or server-side
database. Reports of particular interest include:

- cross-site scripting or unsafe handling of imported JSON documents,
- unsafe handling of uploaded images (for example SVG),
- vulnerabilities in the build or server entry (`src/server.ts`),
- vulnerable or malicious dependencies.

Issues that need physical access to an unlocked device, or that only affect an
unsupported or very outdated browser, are out of scope.
