import { ZodError, z } from "zod";

import { getRequestBody } from "../utils/getRequestBody.js"
import { CreateSubTask } from "../services/flows/CreateSubTask.js";
import { dbConnection } from "../lib/pg.js";
import { NoParamsProvidedError, ResourceNotFoundError } from "../errors/index.js";

const getFlow = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const flow_id = req.params.id;

    const dbClient = await dbConnection();
    
    const { rows, rowCount } = await dbClient.query(`
      SELECT * FROM flows WHERE id = $1;
    `, [flow_id])

    if (!rowCount)
      throw new ResourceNotFoundError()

    const flow = rows[0];

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(flow, null, 2))
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

const createFlow = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);
  
    // const createFlowBodySchema = z.object({
    //   title: z.string(),
    //   owner_id: z.string().uuid(),
    //   board_id: z.string().uuid()
    // })

    const { nodes, edges } = parsedBody

    const dbClient = await dbConnection();

    const flowsData = rows[0];

    return res.setHeader("Content-Type", "application/json").writeHead(201).end();
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

const createSubTask = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    const createSubTaskBodySchema = z.object({
      query: z.string()
    })

    const { query } = createSubTaskBodySchema.parse(parsedBody)

    const createFileService = new CreateSubTask()

    const response = await createFileService.execute(query)

    return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(response, null, 2))
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

export const flowsController = {
  "POST/subtask": {
    protected: true,
    handler: createSubTask
  },
  "GET/flow": {
    protected: true,
    handler: getFlow
  },
  "POST/flows": {
    protected: true,
    handler: createFlow
  }
}
