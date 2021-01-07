"use strict";
/* Routes for invoices */

const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
// const middleware = require("../middleware");
const router = express.Router();


/**  GET /invoices
Return info on invoices: like {invoices: [{id, comp_code}, ...]}
*/

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
           FROM invoices`);
  const invoices = results.rows;

  return res.json({ invoices });
});


/**  GET /invoices/[id]
Returns obj on given invoice, or 404 if invoice cannot be found.
Returns {invoice: 
  {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/

router.get("/:id", async function (req, res, next) {
  const { id } = req.params;
  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
             FROM invoices
             WHERE id = $1`,
    [id]);
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${code}`);

  const codeResults = await db.query(
    `SELECT comp_code
             FROM invoices
             WHERE id = $1`,
    [id]);

  const compCode = codeResults.rows[0].comp_code

  const cResults = await db.query(
    `SELECT code, name, description
             FROM companies
             WHERE code = $1`,
    [compCode]);

  invoice.company = cResults.rows[0];

  return res.json({ invoice })
});


/** POST /companies
Adds an invoice.
Needs to be passed in JSON body of: {comp_code, amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.post('/', async function (req, res, next) {
  const { comp_code, amt } = req.body;
  // NOTE: currently, we are not allowing invoices of 0.
  if (!Number(amt)) throw new BadRequestError(`Invalid amount: ${amt}`);

  // QUESTION: Is it better to include this try/catch, or to add a middleware with a query? 
  let result;
  try {
    result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt],
    );
  } catch (err) {
    throw new BadRequestError(
      `Company code (${comp_code}) does not exist`)
  }

  const invoice = result.rows[0];
  return res.status(201).json({ invoice });
});


module.exports = router;
