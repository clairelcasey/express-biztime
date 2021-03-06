"use strict";
/* Routes for companies */

const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const middleware = require("../middleware");
const router = express.Router();
/**  GET /companies
Returns list of companies, like {companies: [{code, name}, ...]} 
*/

router.get("/", async function (req, res, next) {
  const result = await db.query(
    `SELECT code, name
           FROM companies`);
  const companies = result.rows;

  return res.json({ companies });
});

/**  GET /companies/[code]
Return obj of company: {company: {code, name, description, invoices: [id, ...]}}

If the company given cannot be found, this should return a 404 status response.
*/

router.get("/:code", async function (req, res, next) {
  const { code } = req.params;
  const cResult = await db.query(
    `SELECT code, name, description
             FROM companies
             WHERE code = $1`,
    [code]);
  const company = cResult.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  const iResult = await db.query(`
    SELECT id FROM invoices
      WHERE comp_code = $1
  `, [code]);

  const invoices = iResult.rows.map(i => i.id);
  company.invoices = invoices;

  return res.json({ company })
});

/** POST /companies
Adds a company.

Needs to be given JSON like: {code, name, description}

Returns obj of new company: {company: {code, name, description}}
*/

router.post('/', async function (req, res, next) {
  const { code, name, description } = req.body;
  // QUESTION: Is it better to include this try/catch, or to add a middleware with a query? 
  let result;
  try {
    result = await db.query(
      `INSERT INTO companies (code, name, description)
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
      [code, name, description],
    );
  } catch (err) {
    throw new BadRequestError(
      `Name (${name}) or code (${code}) already exists`)
  }
  const company = result.rows[0];
  return res.status(201).json({ company });
})

/** PUT /companies/[code]
Edit existing company.

returns 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}}
*/

router.put('/:code',
  async function (req, res, next) {
    const { name, description } = req.body;
    const { code } = req.params;

    let result;
    try {
      result = await db.query(
        `UPDATE companies
             SET name=$1,
                 description=$2
             WHERE code = $3
             RETURNING code, name, description`,
        [name, description, code],
      );
    } catch (err) {
      throw new BadRequestError(
        `Name already taken: ${name}`);
    }

    const company = result.rows[0];
    if (!company) throw new NotFoundError(`Not found: ${code}`)

    return res.json({ company });
  });

/** DELETE /companies/[code]
Deletes company.

returns 404 if company cannot be found.

Returns {status: "deleted"} 
*/

router.delete('/:code', async function (req, res, next) {
  const { code } = req.params;

  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
      RETURNING code, name, description`,
    [code],
  );

  const company = result.rows[0];
  if (!company) throw new NotFoundError(`Not found: ${code}`);

  return res.json({ status: "deleted" });
})


module.exports = router;
