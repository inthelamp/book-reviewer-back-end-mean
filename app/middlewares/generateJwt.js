const jwt = require("jsonwebtoken");
require("dotenv").config();

const options = {
  algorithm: 'RS256',
  expiresIn: process.env.SIGNIN_TOKEN_EXPIRE_IN, // Setting token expiry time
};


/**
 * Generating a token containing id, name, and role
 * @param {string} userId - user unique id
 * @param {string} userName - user name
 * @param {string} role - user role
 * @returns {boolean, string} {error, token}
 */
exports.generateJwt = async (userId, userName, role) => {
  const path = require('path');
  const fs = require('fs');

  try {
    const privateKey = fs.readFileSync(path.resolve(process.env.PRIVATE_KEY_PATH), (err, data) => {
      return data;
    })

    const payload = { 
                      userid: userId,
                      name: userName,
                      role: role
                    };
                    
    const token = jwt.sign(payload, privateKey, options);
    
    return { error: false, token: token };
  } catch (error) {
    return { error: true };
  }
}