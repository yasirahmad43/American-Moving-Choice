import { baseDatabaseUrl, ensureDatabase } from "./database";

/** Runs once before all test files: make sure the dedicated test database and its owner exist. */
export default async function setup(): Promise<void> {
  await ensureDatabase(baseDatabaseUrl());
}
