"use strict";
/* Routes for companies */

const express = require("express");
const db = require("../db");
const middleware = require("../middleware");
const router = express.Router();
console.log('db', db);
/**  GET /companies
Returns list of companies, like {companies: [{code, name}, ...]} 
*/

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
           FROM companies`);
  console.log('results.rows', results.rows);
  return res.json({ companies: results.rows })
});

/**  GET /companies/[code]
Return obj of company: {company: {code, name, description}}

If the company given cannot be found, returns a 404 status response. 
*/

router.get("/:code", middleware.codeVerify, async function (req, res, next) {

  const results = await db.query(
    `SELECT code, name, description
             FROM companies
             WHERE code = $1`,
    [req.params.code]);
  return res.json({ company: results.rows[0] })
});



module.exports = router;
