import { z, ZodError } from "zod";

import { UsersDbRepository } from "../repositories/users/db-repository.js";

import { CreateUserService } from "../services/users/CreateUserService.js";
import { FetchUsersService } from "../services/users/FetchUsersService.js";
import { AuthenticateUserService } from "../services/users/AuthenticateUserService.js";
import { DeleteUserService } from "../services/users/DeleteUserService.js";
import { UpdateUserService } from "../services/users/UpdateUserService.js";

import { NoParamsProvidedError } from "../errors/index.js";
import { dbConnection } from "../lib/pg.js"
import { getRequestBody } from "../utils/getRequestBody.js"

let dbClient;

const getUsers = async (_, res) => {
  try {
    const dbClient = await dbConnection();
    
    const usersRepository = new UsersDbRepository(dbClient);
    const fetchUsersService = new FetchUsersService(usersRepository)

    const { users } = await fetchUsersService.execute()

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(users, null, 2));
  } catch (err) {
    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const createUser = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      job: z.string(),
      password: z.string().min(6)
    })

    const { name, job, email, password } = createUserBodySchema.parse(parsedBody)

    const dbClient = await dbConnection();

    const usersRepository = new UsersDbRepository(dbClient);
    const createUserService = new CreateUserService(usersRepository)

    await createUserService.execute({
      name, job, email, password
    })

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }

    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const updateUser = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const updateUserBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: user_id } = updateUserBodySchema.parse({ id })
    
    const dbClient = await dbConnection();

    const usersRepository = new UsersDbRepository(dbClient);
    const updateUserService = new UpdateUserService(usersRepository)

    await updateUserService.execute({ data: parsedBody, user_id })

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }

    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const deleteUser = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const deleteUserBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: user_id } = deleteUserBodySchema.parse({ id })
    
    const dbClient = await dbConnection();

    const usersRepository = new UsersDbRepository(dbClient);
    const deleteUserService = new DeleteUserService(usersRepository)

    await deleteUserService.execute(user_id)

    return res.setHeader("Content-Type", "application/json").writeHead(201).end()
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }

    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const signInUser = async(req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const signInUserBodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    })

    const { email, password } = signInUserBodySchema.parse(parsedBody);

    const dbClient = await dbConnection();

    const usersRepository = new UsersDbRepository(dbClient);
    const authenticateUserService = new AuthenticateUserService(usersRepository)

    const { user, token } = await authenticateUserService.execute({
      email, password
    })

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify({ user, token }))
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .setHeader("Content-Type", "application/json")
        .writeHead(400)
        .end(JSON.stringify({
          statusCode: 400,
          message: JSON.parse(err.message)
        }));
    }
    
    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}

const embedUsers = async (_, res) => {
  try {
    const dbClient = await dbConnection();
    
    const usersRepository = new UsersDbRepository(dbClient);
    // const fetchUsersService = new FetchUsersService(usersRepository)

    // const { users } = await fetchUsersService.execute()
    await usersRepository.embedAllUsers()

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(users, null, 2));
  } catch (err) {
    return res
      .setHeader("Content-Type", "application/json")
      .writeHead(err.statusCode || 500)
      .end(JSON.stringify({
        statusCode: err.statusCode || 500,
        message: err.message
      }));
  }
}


export const usersController = {
  "GET/users": {
    protected: true,
    handler: getUsers
  },
  "POST/users": {
    handler: createUser
  },
  "PUT/users": {
    handler: updateUser
  },
  "DELETE/users": {
    handler: deleteUser
  },
  "POST/session": {
    handler: signInUser
  },
  "POST/embed_users": {
    handler: embedUsers
  },
}
