# Changelog
All notable changes to this project will be documented in this file.

## [0.2.4] - 2021-02-10
### Added
- Timestamps to all console log outputs
- Add mentions in edits to events
- Have cleaner run on boot

### Changed
- Fixed bar that is too long for mobile in polls
- Fixed unicode chars not showing up in mobile polls

## [0.2.4] - 2021-02-09
### Added
- CHANGELOG file
- Added version number to the bot activity
- Made polls post in game-scheduling channel

### Changed
- Show invoker in activity based on production or development environment

## [0.2.3] - 2021-02-09
### Added
- A type variable in Poll and Ask to differentiate them in code
- Filter to ignore reactions on non-bot posts

### Changed
- The calculation of the bar in polls to represent unique user totals

## [0.2.2] - 2021-02-08
### Added
- README file
- Added day of week in date formats
- Ability for "helpful bois" admins to edit and delete all bot posts
- Bot activity to show base help command

### Changed
- Spelling fix in Help commands

## [0.2.1] - 2021-02-05
### Added
- README file
- Cleaner to remove expired posts
- A .env file to make deployment and testing easier

### Changed
- Bugfixes across all files
- Looked for calendar as a substring of the calendar channel name

## [0.2.0] - 2021-02-04
### Added
- MongoDB backend
- DB driver functions
- Dockerfile and Docker Compose files

### Changed
- Split Poll into Poll and Ask commands
- Moved const variables to helper.js in utilities
- Changed invoker from + to -

## [0.1.0] - 2020-11-01
### Added
- Poll and Event commands
- Ping and Help commands
- Time parser
- Automated testing basics
