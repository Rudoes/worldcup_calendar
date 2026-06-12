import assert from "node:assert/strict";
import test from "node:test";
import { CITY_ID_TIME_ZONES, CITY_TIME_ZONES, STADIUM_TIME_ZONES } from "../src/constants.ts";
import { resolveVenueTimeZone } from "../src/fifa.ts";
import type { FifaLocalizedText, FifaStadium } from "../src/types.ts";

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

const EXPECTED_HOST_STADIUM_TIME_ZONES: Record<string, string> = {
  "400017978": "America/Los_Angeles",
  "400098290": "America/New_York",
  "400216606": "America/Los_Angeles",
  "400222084": "America/Mexico_City",
  "400238450": "America/Monterrey",
  "400242032": "America/Toronto",
  "400248370": "America/Vancouver",
  "400248622": "America/New_York",
  "400248623": "America/New_York",
  "400249385": "America/Chicago",
  "400252150": "America/Mexico_City",
  "400254717": "America/Chicago",
  "400257521": "America/Los_Angeles",
  "400257525": "America/New_York",
  "400257526": "America/Chicago",
  "400257536": "America/New_York"
};

const EXPECTED_HOST_CITY_ID_TIME_ZONES: Record<string, string> = {
  "400019415": "America/Chicago",
  "400019416": "America/Los_Angeles",
  "400021919": "America/New_York",
  "400021920": "America/Los_Angeles",
  "400221951": "America/Chicago",
  "400221953": "America/New_York",
  "400222090": "America/Monterrey",
  "400222091": "America/Mexico_City",
  "400222094": "America/Mexico_City",
  "400242043": "America/Toronto",
  "400248375": "America/Vancouver",
  "400248627": "America/New_York",
  "400249343": "America/Chicago",
  "400249345": "America/Los_Angeles",
  "400254039": "America/New_York",
  "400256355": "America/New_York"
};

const localized = (description: string): FifaLocalizedText[] => [{ Locale: "en-GB", Description: description }];

function stadium(overrides: Partial<FifaStadium>): FifaStadium {
  return {
    IdStadium: "400257536",
    IdCity: "400021919",
    Name: localized("New York/New Jersey Stadium"),
    CityName: localized("New Jersey"),
    IdCountry: "USA",
    ...overrides
  };
}

test("maps all current FIFA stadium IDs to venue time zones", () => {
  for (const [stadiumId, timeZone] of Object.entries(EXPECTED_HOST_STADIUM_TIME_ZONES)) {
    assert.equal(STADIUM_TIME_ZONES[stadiumId], timeZone, stadiumId);
  }
});

test("maps all current FIFA city IDs to venue time zones", () => {
  for (const [cityId, timeZone] of Object.entries(EXPECTED_HOST_CITY_ID_TIME_ZONES)) {
    assert.equal(CITY_ID_TIME_ZONES[cityId], timeZone, cityId);
  }
});

test("maps all known FIFA host city labels to venue time zones", () => {
  for (const [city, timeZone] of Object.entries(EXPECTED_HOST_CITY_TIME_ZONES)) {
    assert.equal(CITY_TIME_ZONES[city], timeZone, city);
  }
});

test("resolves timezone by stadium ID when FIFA renames a city label", () => {
  assert.equal(
    resolveVenueTimeZone(stadium({ CityName: localized("NY/NJ Metro Area") })),
    "America/New_York"
  );
});

test("resolves timezone by city ID when FIFA changes a stadium ID", () => {
  assert.equal(
    resolveVenueTimeZone(stadium({ IdStadium: "future-stadium-id", CityName: localized("NY/NJ Metro Area") })),
    "America/New_York"
  );
});

test("resolves timezone by city label for legacy records without FIFA IDs", () => {
  assert.equal(
    resolveVenueTimeZone(stadium({ IdStadium: undefined, IdCity: undefined, CityName: localized("New Jersey") })),
    "America/New_York"
  );
});

test("fails explicitly for unknown venues instead of falling back to UTC", () => {
  assert.throws(
    () => resolveVenueTimeZone(stadium({
      IdStadium: "unknown-stadium",
      IdCity: "unknown-city",
      Name: localized("Unknown Stadium"),
      CityName: localized("Unknown City")
    })),
    /Missing venue timezone mapping for Unknown Stadium/
  );
});
