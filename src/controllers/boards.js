
import { dbConnection } from "../lib/pg.js"
import { BoardsDbRepository } from "../repositories/boards/db-repository.js";
import { CreateBoardService } from "../services/boards/CreateBoardService.js";
import { DeleteBoardService } from "../services/boards/DeleteBoardService.js";
import { UpdateBoardService } from "../services/boards/UpdateBoardService.js";
import { getRequestBody } from "../utils/getRequestBody.js"

let dbClient;

const getBoards = async (_, res) => {
  if (!dbClient)
    dbClient = await dbConnection()
  
  const data = await dbClient.query(`
    SELECT 
      boards.id, 
      boards.title, 
      boards.priority, 
      boards.created_at, 
      board_owner.id AS owner_id, 
      board_owner.name AS owner_name, 
      board_owner.profile_picture AS owner_profile_picture,
      COALESCE(Boards_data.Boards, '[]') AS Boards
    FROM 
      boards
    JOIN 
      users AS board_owner ON boards.owner_id = board_owner.id
    LEFT JOIN LATERAL (
      SELECT 
        json_agg(
          json_build_object(
            'id', Boards.id,
            'title', Boards.title,
            'description', Boards.description,
            'owner_id', Board_owner.id,
            'owner_name', Board_owner.name,
            'owner_profile_picture', Board_owner.profile_picture,
            'members', COALESCE(members_data.members, '[]')
          )
        ) AS Boards
    FROM 
      Boards
    LEFT JOIN 
      users AS Board_owner ON Boards.owner_id = Board_owner.id
    LEFT JOIN LATERAL (
      SELECT 
        json_agg(
          json_build_object(
            'id', members.id,
            'name', members.name,
            'profile_picture', members.profile_picture
          )
        ) AS members
      FROM 
        unnest(Boards.members) AS member_id
      LEFT JOIN 
        users AS members ON members.id = member_id
    ) AS members_data ON true
    WHERE 
      Boards.board_id = boards.id
    ) AS Boards_data ON true;
  `);

  return res.setHeader("Content-Type", "application/json").writeHead(200).end(JSON.stringify(data.rows, null, 2));
}

const createBoard = async (req, res, broadcast) => {
  const { parsedBody } = await getRequestBody(req);
  const { title, owner_id } = parsedBody;

  if (!dbClient)
    dbClient = await dbConnection()
  
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
    
    if (!dbClient)
      dbClient = await dbConnection()

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
    
    if (!dbClient)
      dbClient = await dbConnection()

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
