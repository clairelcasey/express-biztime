"use strict";

/* Middleware. */

const { NotFoundError, BadRequestError } = require('./expressError');
const db = require("./db");

/** Company code verifier: checks if param is valid or raise NotFoundError */

async function codeVerify(req, res, next) {
  const { code } = req.params;
  const companies = await db.query(
  `SELECT code
           FROM companies`);
  if (companies.rows.find( n => n.code === code)) {
    return next();
  } else {
    throw new NotFoundError(`Invalid Company Code: ${code}`); 
  }
}

/** Company name unique constraint check
 * cannot PUT or POST if name if already taken
 * raise BadRequestError if name taken
 */

async function nameVerify(req, res, next) {
  const { name } = req.body;

  const companies = await db.query(`
    SELECT name FROM companies
  `);

  if (companies.rows.find(company => company.name === name)) {
    throw new BadRequestError(`Company name already exists: ${name}`);
  } else {
    return next();
  }
}


module.exports = { codeVerify, nameVerify }