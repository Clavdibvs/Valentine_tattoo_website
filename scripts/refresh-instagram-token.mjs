#!/usr/bin/env node
/**
 * Instagram access-token maintenance.
 *
 *   npm run instagram:exchange   short-lived  ->  long-lived (60 days)
 *   npm run instagram:refresh    long-lived   ->  long-lived (another 60 days)
 *
 * Long-lived Instagram User access tokens last ~60 days and do NOT auto-renew.
 * A token that has already expired cannot be refreshed — you have to redo the
 * login flow. Refresh on a schedule, around day 50.
 *
 * Reads from the process environment (or a local .env.local); prints the new
 * token so you can paste it into your host's environment settings. It never
 * writes secrets to disk.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const HOST = "https://graph.instagram.com";

/* Load .env.local without adding a dependency. */
function loadLocalEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

loadLocalEnv();

const exchangeMode = process.argv.includes("--exchange");
const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

if (!token) fail("INSTAGRAM_ACCESS_TOKEN is not set (put it in .env.local or the environment).");

const url = new URL(exchangeMode ? `${HOST}/access_token` : `${HOST}/refresh_access_token`);

if (exchangeMode) {
  const secret = process.env.INSTAGRAM_APP_SECRET?.trim();
  if (!secret) fail("INSTAGRAM_APP_SECRET is required for --exchange.");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", secret);
} else {
  url.searchParams.set("grant_type", "ig_refresh_token");
}
url.searchParams.set("access_token", token);

const response = await fetch(url, { headers: { Accept: "application/json" } });
const body = await response.json().catch(() => null);

if (!response.ok) {
  const message = body?.error?.message ?? `HTTP ${response.status}`;
  fail(
    `Instagram rejected the request: ${message}\n` +
      "  If the token has already expired you must repeat the Instagram Login flow —\n" +
      "  expired tokens cannot be refreshed.",
  );
}

const expiresInDays = Math.round((body.expires_in ?? 0) / 86400);

console.log("\n✓ New long-lived token issued");
console.log(`  valid for ~${expiresInDays} days (until ${new Date(Date.now() + (body.expires_in ?? 0) * 1000).toISOString().slice(0, 10)})`);
console.log("\n  INSTAGRAM_ACCESS_TOKEN=" + body.access_token + "\n");
console.log("  Update this value wherever the site is hosted, then redeploy.");
console.log("  Set a reminder to run this again in ~50 days.\n");
