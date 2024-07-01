import jwt from "jsonwebtoken";
import { InvalidTokenError, UnauthorizedError } from "../errors/index.js";
import { authConfig } from "../config/auth.js";

export function authMiddleware(req) {
  const { Authorization: authorization } = req.headers;
  
  if (!authorization) {
    const error = new UnauthorizedError()
    throw error;
  }

  const [_, token] = authorization.split(" ")

  if (!token) 
    throw new UnauthorizedError()

  try {
    const decoded = jwt.verify(token, authConfig.secret)
  } catch (e) {
    throw new InvalidTokenError()
  }

  return;
}
