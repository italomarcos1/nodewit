
import { dbConnection } from "../lib/pg.js"
import { BoardsDbRepository } from "../repositories/boards/db-repository.js";
import { CreateBoardService } from "../services/boards/CreateBoardService.js";
import { DeleteBoardService } from "../services/boards/DeleteBoardService.js";
import { FetchBoardsService } from "../services/boards/FetchBoardsService.js";
import { UpdateBoardService } from "../services/boards/UpdateBoardService.js";
import { getRequestBody } from "../utils/getRequestBody.js"

let dbClient;

const getBoards = async (_, res) => {
  const dbClient = await dbConnection();
  
  const boardsRepository = new BoardsDbRepository(dbClient)
  const fetchBoardsService = new FetchBoardsService(boardsRepository)

  const { boards } = await fetchBoardsService.execute()

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(boards, null, 2));
}

const createBoard = async (req, res, broadcast) => {
  const { parsedBody } = await getRequestBody(req);
  const { title, owner_id } = parsedBody;

  const dbClient = await dbConnection();
  
  const boardsRepository = new BoardsDbRepository(dbClient)
  const createBoardService = new CreateBoardService(boardsRepository)

  const { board } = await createBoardService.execute({
    title, owner_id
  })

  broadcast("board", JSON.stringify(board))

  return res.setHeader("Content-Type", "application/json").writeHead(201).end();
}

const updateBoard = async (req, res) => {
  try {
    const { parsedBody } = await getRequestBody(req);

    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const updateBoardBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: board_id } = updateBoardBodySchema.parse({ id })
    
    const dbClient = await dbConnection()

    const boardsRepository = new BoardsDbRepository(dbClient);
    const updateBoardService = new UpdateBoardService(boardsRepository)

    await updateBoardService.execute({ data: parsedBody, board_id })

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

const deleteBoard = async (req, res) => {
  try {
    if (!req.params || !req.params.id)
      throw new NoParamsProvidedError()
  
    const id = req.params.id;

    const deleteBoardBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id: board_id } = deleteBoardBodySchema.parse({ id })
    
    const dbClient = await dbConnection()

    const boardsRepository = new BoardsDbRepository(dbClient);
    const deleteBoardService = new DeleteBoardService(boardsRepository)

    await deleteBoardService.execute(board_id)

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

export const boardsController = {
  "GET/boards": {
    protected: true,
    handler: getBoards
  },
  "POST/boards": {
    protected: true,
    handler: createBoard
  },
  "PUT/boards": {
    handler: updateBoard
  },
  "DELETE/boards": {
    handler: deleteBoard
  },
}
