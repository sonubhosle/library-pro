/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./electron/db/schema.js",
    out: "./electron/db/migrations",
    driver: "better-sqlite",
    dbCredentials: {
        url: "library.db",
    },
};
