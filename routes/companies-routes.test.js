"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompanyCode;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  const results = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ('testCode', 'testName', 'testDescription)
         RETURNING code, name, description`);
  testCompanyCode = results.rows[0].id;
});

afterAll(async function () {
  await db.end();
});

// test adding a company where code already exists