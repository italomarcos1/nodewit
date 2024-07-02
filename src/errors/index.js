class BaseError extends Error {
  statusCode;
}

export class UnauthorizedError extends BaseError {
  constructor() {
    super("Unauthorized");
    this.statusCode = 401;
  }
}

export class InvalidCredentialsError extends BaseError {
  constructor() {
    super("Invalid email/password combination")
    this.statusCode = 400;
  }
}

export class InvalidTokenError extends BaseError {
  constructor() {
    super("Token invalid or expired")
    this.statusCode = 400;
  }
}

export class UserAlreadyExistsError extends BaseError {
  constructor() {
    super("An user with this email already exists")
    this.statusCode = 400;
  }
}

export class NoParamsProvidedError extends BaseError {
  constructor() {
    super("No params provided")
    this.statusCode = 400;
  }
}
