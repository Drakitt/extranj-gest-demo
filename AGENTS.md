# CRM Servicios Demo

Work only inside this independent project. Do not access or modify anything
outside this repository.

Scope: fictional clients, services, quotations and simulated follow-ups.
Do not add real communications, fiscal integrations or production credentials.

Database operations, Docker startup and application startup require explicit
authorization. Keep the database destination guard in every database entry point.
Development and build commands must not run migrations or seeds automatically.
Never expose `.env` values. Do not commit environment files, generated output or
customer data.

Use one implementation executor at a time. Run the checks in package.json after
relevant changes. A successful build does not establish a working database or
an end-to-end browser test.

Remote: https://github.com/Drakitt/extranj-gest-demo.
Do not publish the repository or deploy the application without authorization.

Before changing Next.js code, consult the documentation bundled with the installed
Next.js version where available.
