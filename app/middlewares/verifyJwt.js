const jwt = require("jsonwebtoken");

require("dotenv").config();

const User = require("../models/user");

/**
 * Verifying token
 */
exports.verifyJwt = async (req, res, next) => {
  const authString = req.headers.authorization;
  const userid = req.headers.userid;

  let result;

  // Checking if the auth string is provided
  if (!authString) {
    return res.status(401).json({
      error: true,
      message: "Access token is missing",
    });
  }
   
  // Getting token from the auth string
  const token = authString.split(" ")[1]; // Bearer <token>
  const options = {
    algorithms: ['RS256'],
  };

  try {

    // Retriving user with the token
    let user = await User.Model.findOne({
      accessToken: token,
    });

    // Making an error if not found
    if (!user || user.id !== userid ) {
      result = {
        error: true,
        message: "Authorization error",
      };
      return res.status(403).json(result);
    }

    const path = require('path');
    const fs = require('fs'); 
    
    const publicKey = fs.readFileSync(path.resolve(process.env.PUBLIC_KEY_PATH), (err, data) => {
      return data;
    })

    // verifying token with the secret word
    result = jwt.verify(token, publicKey, options);

    // Checking if token from client is valid or not
    if (user.id !== result.userid) {
      result = {
        error: true,
        message: "Invalid token",
      };
      return res.status(401).json(result);
    }
        
    req.decoded = result;
    
    next();
  } catch (err) {
    console.error(err);
    if (err.name === "TokenExpiredError") {
      result = {
        error: true,
        message: "Expired token",
      };
    } else {
      result = {
        error: true,
        message: "Authentication error",
      };
    }
    return res.status(403).json(result);
  }
}