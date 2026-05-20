This folder is reserved for middleware-style modules such as:

- auth guards
- role guards
- request parsing
- csrf checks
- rate limiting

The current app keeps those checks inside `src/app.js`, but this folder is now part of the project structure for future extraction.
