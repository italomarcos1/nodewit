import { ZodError, z } from "zod";
import { dbConnection } from "../lib/pg.js"

import { getRequestBody } from "../utils/getRequestBody.js"
import { GetPresignedUrl } from "../services/files/GetPresignedUrl.js";
import { FilesDbRepository } from "../repositories/files/db-repository.js";
import { CreateFileService } from "../services/files/CreateFileService.js";
import { NoParamsProvidedError } from "../errors/index.js";
import { FetchFilesByCardIdService } from "../services/files/FetchFilesByCardIdService.js";
import { DeleteFileService } from "../services/files/DeleteFileService.js";

let dbClient;

const getPresignedUrl = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req)

    const getPresignedUrlBodySchema = z.object({
      fileName: z.string(),
      fileType: z.string(),
      method: z.enum(["PUT", "DELETE"]),
    })
    
    const { fileName, fileType, method } = getPresignedUrlBodySchema.parse(parsedBody)
    
    const getPresignedUrlService = new GetPresignedUrl()
    const response = await getPresignedUrlService.execute({ fileName, fileType, method })
    
    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(response, null, 2))
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

const getFilesByCardId = async (req, res) => {
  try { 
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
    
    const card_id = req.params.id;

    const dbClient = await dbConnection();
    
    const filesRepository = new FilesDbRepository(dbClient);
    const fetchFilesService = new FetchFilesByCardIdService(filesRepository)

    const { files } = await fetchFilesService.execute(card_id)

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(files, null, 2))
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

const createFile = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const createFileBodySchema = z.object({
      name: z.string(),
      url: z.string(),
      extension: z.string(),
      size: z.string(),
      owner_id: z.string().uuid(),
      card_id: z.string().uuid(),
    })

    const { name, url, extension, size, owner_id, card_id } = createFileBodySchema.parse(parsedBody)

    const dbClient = await dbConnection();

    const filesRepository = new FilesDbRepository(dbClient);
    const createFileService = new CreateFileService(filesRepository)

    const file = await createFileService.execute({
      name, url, extension, size, owner_id, card_id
    })

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(file, null, 2))
  } catch (err) {
    console.log('err', err)
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

const deleteFile = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const deleteFileBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: file_id } = deleteFileBodySchema.parse({ id })
    
    const dbClient = await dbConnection();

    const filesRepository = new FilesDbRepository(dbClient);
    const deleteFileService = new DeleteFileService(filesRepository)

    await deleteFileService.execute(file_id)

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

export const filesController = {
  "GET/files": {
    protected: true,
    handler: getFilesByCardId
  },
  "POST/files": {
    protected: true,
    handler: createFile
  },
  "POST/presign": {
    protected: true,
    handler: getPresignedUrl
  },
  "DELETE/files": {
    handler: deleteFile
  },
}
