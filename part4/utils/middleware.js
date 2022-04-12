const logger = require("./logger");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const tokenExtractor = (request,response,next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
     request.token = authorization.substring(7);
    next();
  }
  return;
};
const userExtractor = async (request,response,next)=>{
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" });
  }
  const user = await User.findById(decodedToken.id);
  request.user = user;
  next()
}

const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("path: ", request.path);
  logger.info("Body: ", request.body);
  logger.info("---");
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "castError")
    return response.status(400).send({ error: "malformatted id " });
  else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }else if(error.name === 'JsonWebTokenError'){
    return response.status(401).json({
      error:'Invalid token'
    })
  }

  next(error);
};



module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor
};
