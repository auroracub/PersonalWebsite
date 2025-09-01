import { defineConfig } from "vite";

export default defineConfig({
    root: "./",
    publicDir: "./static/",
    base: process.env.NODE_ENV === "production" ? "/personal-website/" : "",
});
