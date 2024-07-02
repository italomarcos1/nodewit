import { dbConnection } from "../lib/pg.js"
import { getRequestBody } from "../utils/getRequestBody.js"

import { env } from "../env/index.js";

import { generateFileKey } from "../utils/generateFileKey.js";
import { parseUrl } from "@smithy/url-parser";
import { Hash } from "@smithy/hash-node";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { HttpRequest } from "@smithy/protocol-http";
import { formatUrl } from "@aws-sdk/util-format-url"

import { UsersDbRepository } from "../repositories/users/db-repository.js";
import { CreateUserService } from "../services/users/CreateUserService.js";
import { FetchUsersService } from "../services/users/FetchUsersService.js";
import { AuthenticateUserService } from "../services/users/AuthenticateUserService.js";
import { z, ZodError } from "zod";
import { NoParamsProvidedError } from "../errors/index.js";
import { DeleteUserService } from "../services/users/DeleteUserService.js";
import { UpdateUserService } from "../services/users/UpdateUserService.js";

let dbClient;

const getUsers = async (_, res) => {
  try {
    if (!dbClient)
      dbClient = await dbConnection()
    
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

    if (!dbClient)
      dbClient = await dbConnection()

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
    
    if (!dbClient)
      dbClient = await dbConnection()

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
    
    if (!dbClient)
      dbClient = await dbConnection()

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

    if (!dbClient)
      dbClient = await dbConnection()

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

const getPresignedUrl = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req)
   
    const { fileName, fileType } = parsedBody;
    const originalFilename = fileName;

    const {
      fileId, fileKey, fileName: generatedFileName,
    } = generateFileKey({
      fileKeyPrefix: 'dewit',
      fileType: fileType,
      fileName: originalFilename,
    })
  
    if (!fileId) return {}
      
    const s3ObjectUrl = parseUrl(
      `https://mc2024.s3.amazonaws.com/${fileKey}`,
    )
  
    const presignerOptions = {
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      region: env.S3_REGION,
      sha256: Hash.bind(null, 'sha256'),
    }
  
    const presigner = new S3RequestPresigner(presignerOptions)
  
    const presignedParams = await presigner.presign(
      new HttpRequest({ ...s3ObjectUrl, method: 'PUT' }),
      { expiresIn: 300 },
    )

    const url = formatUrl(presignedParams)
  
    
    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify({ url }))
  } catch (err) {
    // TODO: retornar o erro certo
    console.log('err', err)
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
  "POST/presign": {
    protected: true,
    handler: getPresignedUrl
  }
}
