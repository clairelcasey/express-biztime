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
  const result = await db.query(
    `SELECT id, comp_code
           FROM invoices`);
  const invoices = result.rows;

  return res.json({ invoices });
});


/**  GET /invoices/[id]
Returns obj on given invoice, or 404 if invoice cannot be found.
Returns {invoice: 
  {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/

router.get("/:id", async function (req, res, next) {
  const { id } = req.params;
  // TODO: consider refactoring to remove the second query and combine with first. 
  const iResult = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
             FROM invoices
             WHERE id = $1`,
    [id]);
  const invoice = iResult.rows[0];

  if (!invoice) throw new NotFoundError(`Not found: ${code}`);

  const codeResult = await db.query(
    `SELECT comp_code
             FROM invoices
             WHERE id = $1`,
    [id]);

  const compCode = codeResult.rows[0].comp_code

  const cResult = await db.query(
    `SELECT code, name, description
             FROM companies
             WHERE code = $1`,
    [compCode]);

  invoice.company = cResult.rows[0];

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

  // QUESTION: Is it better to include this try/catch, or to add a middleware with a query? Discussed transaction "racing" and both options, choosing to leave as try/catch. 
  let iResult;
  try {
    iResult = await db.query(
      `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt],
    );
  } catch (err) {
    throw new BadRequestError(
      // NOTE: potentially refactor to be more specific. could search if phrase inside of string. 
      `Company code does not exist: ${comp_code}`)
  }

  const invoice = iResult.rows[0];
  // TODO: add a global constant for our status codes. 
  return res.status(201).json({ invoice });
});

/** PUT /invoices/[id]
Updates an invoice.

If invoice cannot be found, returns a 404.

Needs to be passed in a JSON body of {amt}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} 
*/

router.put('/:id',
  async function (req, res, next) {
    const { amt } = req.body;
    const { id } = req.params;

    if (!Number(amt)) throw new BadRequestError(`Invalid amount: ${amt}`);

    const iResult = await db.query(
      `UPDATE invoices
           SET amt = $1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id],
    );
    const invoice = iResult.rows[0];
    if (!invoice) throw new NotFoundError(`Not found: ${id}`)

    return res.json({ invoice });
});

/** DELETE /invoices/[id]
Deletes an invoice.

If invoice cannot be found, returns a 404.

Returns: {status: "deleted"}
*/

router.delete('/:id', async function (req, res, next) {
  const { id } = req.params;

  const iResult = await db.query(
    `DELETE FROM invoices WHERE id = $1
      RETURNING id`,
    [id],
  );

  const invoice = iResult.rows[0];
  if (!invoice) throw new NotFoundError(`Not found: ${id}`);

  return res.json({ status: "deleted" });
})


module.exports = router;
