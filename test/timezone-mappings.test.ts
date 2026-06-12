import assert from "node:assert/strict";
import test from "node:test";
import { CITY_TIME_ZONES } from "../src/constants.ts";

const EXPECTED_HOST_CITY_TIME_ZONES: Record<string, string> = {
  Atlanta: "America/New_York",
  Boston: "America/New_York",
  Dallas: "America/Chicago",
  Guadalajara: "America/Mexico_City",
  Houston: "America/Chicago",
  "Kansas City": "America/Chicago",
  "Los Angeles": "America/Los_Angeles",
  "Mexico City": "America/Mexico_City",
  Miami: "America/New_York",
  Monterrey: "America/Monterrey",
  "New Jersey": "America/New_York",
  "New York": "America/New_York",
  Philadelphia: "America/New_York",
  "San Francisco": "America/Los_Angeles",
  "San Francisco Bay Area": "America/Los_Angeles",
  Seattle: "America/Los_Angeles",
  Toronto: "America/Toronto",
  Vancouver: "America/Vancouver"
};

test("maps all known FIFA host city labels to venue time zones", () => {
  for (const [city, timeZone] of Object.entries(EXPECTED_HOST_CITY_TIME_ZONES)) {
    assert.equal(CITY_TIME_ZONES[city], timeZone, city);
  }
});
