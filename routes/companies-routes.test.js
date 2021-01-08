"use strict";
// TODO global constants for status codes
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let company;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  const cResults = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ('testcode', 'testName', 'testDescription')
         RETURNING code, name, description`);
  company = cResults.rows[0];

  const iResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
    VALUES ('${company.code}', '1')
    RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );
  const invoices = iResults.rows.map(i => i.id);
  company.invoices = invoices;

});

// QUESTION: what does this do? 
afterAll(async function () {
  await db.end();
});

/* GET /companies - returns {companies: [company,...]} */

describe(" GET /companies", function () {
  test("Gets a list of all companies", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies: [
        {
          code: company.code,
          name: company.name,
        }],
    });
  });
});

/** GET /companies/[code] - return data about one company: `{company: company}` */

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${company.code}`);
    expect(resp.body).toEqual({ company });
  });

  test("Respond with 404 if not found", async function () {
    const resp = await request(app).get(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  });
});


/** POST /companies - create company from data; return `{company: company}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const addComp = {
      code: "Ezra",
      name: "EzraName",
      description: "test"
    };
    const resp = await request(app)
      .post(`/companies`)
      .send(addComp);
    expect(resp.statusCode).toEqual(201);

    expect(resp.body).toEqual({ company: addComp });
  });

  test("Respond with 400 if name or code already exists", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send(company);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": `Name (${company.name}) or code (${company.code}) already exists`,
        "status": 400
      }
    });
  });

  test("Should prevent SQL injection", async function () {
    const testComp = {
      code: "Ezra",
      name: "EzraName",
      description: "test); DELETE FROM companies; --"
    };
    const resp = await request(app)
      .post(`/companies`)
      .send(testComp);

    const companies = await db.query(`SELECT code FROM companies`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ company: testComp });
    expect(companies.rows.length).toEqual(2);
  });
});


/** PUT /companies/[code] - update company; return `{company: company}` */

describe("PUT /companies/:code", function () {
  test("Update a single company", async function () {
    const resp = await request(app)
      .put(`/companies/${company.code}`)
      .send({ name: "Troll", description: company.description });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: {
        code: company.code,
        description: company.description,
        name: "Troll"
      },
    });
  });

  test("Respond with 404 if nout found", async function () {
    const resp = await request(app).patch(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  });

  test("Respond with 400 if name already exists", async function () {
    await db.query(
      `INSERT INTO companies (code, name, description)
             VALUES ('test2', 'test2', 'test2')
             RETURNING code, name, description`);

    const resp = await request(app)
      .put(`/companies/${company.code}`)
      .send({ name: 'test2', description: company.description });


    expect(resp.body).toEqual({
      "error": {
        "message": `Name already taken: test2`,
        "status": 400
      }
    });
  });
});


// test adding a company where code already exists