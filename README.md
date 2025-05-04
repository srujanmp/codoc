# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.





> create-t3-app

   ___ ___ ___   __ _____ ___   _____ ____    __   ___ ___
  / __| _ \ __| /  \_   _| __| |_   _|__ /   /  \ | _ \ _ \
 | (__|   / _| / /\ \| | | _|    | |  |_ \  / /\ \|  _/  _/
  \___|_|_\___|_/‾‾\_\_| |___|   |_| |___/ /_/‾‾\_\_| |_|


│
◇  What will your project be called?
│  codoc
│
◇  Will you be using TypeScript or JavaScript?
│  TypeScript
│
◇  Will you be using Tailwind CSS for styling?
│  Yes
│
◇  Would you like to use tRPC?
│  Yes
│
◇  What authentication provider would you like to use?
│  NextAuth.js
│
◇  What database ORM would you like to use?
│  Prisma
│
◇  Would you like to use Next.js App Router?
│  Yes
│
◇  What database provider would you like to use?
│  PostgreSQL
│
◇  Would you like to use ESLint and Prettier or Biome for linting and formatting?
│  ESLint/Prettier
│
◇  Should we initialize a Git repository and stage the changes?
│  Yes
│
◇  Should we run 'npm install' for you?
│  Yes
│
◇  What import alias would you like to use?
│  ~/



Next steps:
  cd codoc
  Start up a database, if needed using './start-database.sh'
  npm run db:push
  Fill in your .env with necessary values. See https://create.t3.gg/en/usage/first-steps for more info.
  npm run dev
  git commit -m "initial commit"



  ** npm run db:push


** POSTGRESQL COMMANDS
psql codoc

codoc=# \dt
               List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | Account           | table | postgres
 public | Post              | table | postgres
 public | Session           | table | postgres
 public | User              | table | postgres
 public | VerificationToken | table | postgres

codoc=# select * from "Account";
codoc=# select * from "Post";
codoc=# select * from "Session";
codoc=# select * from "User";
codoc=# select * from "VerificationToken";


http://localhost:3000/api/auth/signin

If your app includes tRPC, check out src/pages/index.tsx and src/server/api/routers/post.ts to see how tRPC queries work.