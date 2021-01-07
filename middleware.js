"use strict";

/* Middleware. */

const { NotFoundError } = require('./expressError');
const db = require("./db");

/** Company code verifier: checks if param is valid or raise NotFoundError */

async function codeVerify(req, res, next) {
  const companies = await db.query(
  `SELECT code
           FROM companies`);
  console.log('companies.rows', companies.rows);
  console.log('request.params.code', req.params.code)
  if (companies.rows.find( n => n.code === req.params.code)) {
    return next();
  } else {
    throw new NotFoundError("Invalid Company Code");
  }
}

module.exports = { codeVerify}