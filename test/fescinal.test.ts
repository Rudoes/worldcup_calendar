import assert from "node:assert/strict";
import test from "node:test";
import { buildFescinalDataFile, filterUpcomingSessions, parseFescinalProgrammingPage } from "../src/fescinal.ts";
import { buildFescinalIcs } from "../src/ics-fescinal.ts";

const sourceUrl = "https://www.fescinal.es/programacion/7/2026/";

const sampleHtml = `
<h5 class="title-fescinal text-uppercase">Programaci&oacute;n para el 10 de julio de 2026</h5>
<div class="row py-3 px-2">
  <div class="col-sm-3 col-6 px-2">
    <div class="card bg-white">
      <img class="card-img-top" src="/media/portadas/proyecto.jpg" alt="PROYECTO SALVACION" />
      <h5 class="card-title"><a href="/pelicula/proyecto-salvacion-412/" class="link-fescinal">
        PROYECTO SALVACION
      </a></h5>
      <small class="card-text"> <b>Fecha:</b> viernes, 10 julio 2026 <br></small>
      <small class="card-text"> <b>Hora:</b> 22:15 - 01:01<br></small>
      <small class="card-text"> <b>Sala:</b> Sala 1 <br></small>
      <a href="/add/?pid=412" class="btn">Entradas</a>
    </div>
  </div>
  <div class="col-sm-3 col-6 px-2">
    <div class="card bg-white">
      <img class="card-img-top" src="/media/portadas/morir.jpg" alt="MORIR NO SIEMPRE SALE BIEN" />
      <h5 class="card-title"><a href="/pelicula/morir-no-siempre-sale-bien-413/" class="link-fescinal">
        MORIR NO SIEMPRE SALE BIEN
        + COLOQUIO
      </a></h5>
      <small class="card-text"> <b>Fecha:</b> viernes, 10 julio 2026 <br></small>
      <small class="card-text"> <b>Hora:</b> 01:01 - 02:48<br></small>
      <small class="card-text"> <b>Sala:</b> Sala 1 <br></small>
    </div>
  </div>
</div>`;

test("parses Fescinal sessions from programming cards", () => {
  const sessions = parseFescinalProgrammingPage(sampleHtml, sourceUrl);

  assert.equal(sessions.length, 2);
  assert.equal(sessions[0]!.title, "PROYECTO SALVACION");
  assert.equal(sessions[0]!.screen, "Sala 1");
  assert.equal(sessions[0]!.filmUrl, "https://www.fescinal.es/pelicula/proyecto-salvacion-412/");
  assert.equal(sessions[0]!.ticketUrl, "https://www.fescinal.es/add/?pid=412");
  assert.equal(sessions[1]!.title, "MORIR NO SIEMPRE SALE BIEN + COLOQUIO");
});

test("normalizes Fescinal after-midnight sessions to the next local date", () => {
  const sessions = parseFescinalProgrammingPage(sampleHtml, sourceUrl);

  assert.equal(sessions[0]!.localStart, "2026-07-10T22:15:00");
  assert.equal(sessions[0]!.localEnd, "2026-07-11T01:01:00");
  assert.equal(sessions[0]!.startUtc, "2026-07-10T20:15:00.000Z");
  assert.equal(sessions[0]!.endUtc, "2026-07-10T23:01:00.000Z");

  assert.equal(sessions[1]!.localStart, "2026-07-11T01:01:00");
  assert.equal(sessions[1]!.localEnd, "2026-07-11T02:48:00");
  assert.equal(sessions[1]!.startUtc, "2026-07-10T23:01:00.000Z");
  assert.equal(sessions[1]!.endUtc, "2026-07-11T00:48:00.000Z");
});

test("filters to upcoming Fescinal sessions only", () => {
  const sessions = parseFescinalProgrammingPage(sampleHtml, sourceUrl);
  const upcoming = filterUpcomingSessions(sessions, new Date("2026-07-10T21:00:00.000Z"));

  assert.deepEqual(upcoming.map((session) => session.title), ["MORIR NO SIEMPRE SALE BIEN + COLOQUIO"]);
});

test("Fescinal ICS omits poster metadata", () => {
  const sessions = parseFescinalProgrammingPage(sampleHtml, sourceUrl);
  const data = buildFescinalDataFile(sessions, "2026-07-10T12:00:00.000Z", "2026-07-10T12:00:00.000Z");
  const ics = buildFescinalIcs(data);

  assert.match(ics, /SUMMARY:PROYECTO SALVACION/);
  assert.doesNotMatch(ics, /ATTACH|IMAGE|media\/portadas|poster/i);
});
