#!/usr/bin/env node
/**
 * Syncs version across tauri.conf.json and Cargo.toml.
 * Called by semantic-release via @semantic-release/exec.
 *
 * Usage: node scripts/update-version.mjs <version>
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/update-version.mjs <version>");
  process.exit(1);
}

// Update src-tauri/tauri.conf.json
const tauriPath = resolve("src-tauri/tauri.conf.json");
const tauriConf = JSON.parse(readFileSync(tauriPath, "utf-8"));
tauriConf.version = version;
writeFileSync(tauriPath, JSON.stringify(tauriConf, null, 2) + "\n");
console.log(`tauri.conf.json -> ${version}`);

// Update src-tauri/Cargo.toml
const cargoPath = resolve("src-tauri/Cargo.toml");
let cargo = readFileSync(cargoPath, "utf-8");
cargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
writeFileSync(cargoPath, cargo);
console.log(`Cargo.toml -> ${version}`);
