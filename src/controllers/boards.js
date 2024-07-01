
import { dbConnection } from "../lib/pg.js"
import { BoardsDbRepository } from "../repositories/boards/db-repository.js";
import { CreateBoardService } from "../services/boards/CreateBoardService.js";
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
      COALESCE(cards_data.cards, '[]') AS cards
    FROM 
      boards
    JOIN 
      users AS board_owner ON boards.owner_id = board_owner.id
    LEFT JOIN LATERAL (
      SELECT 
        json_agg(
          json_build_object(
            'id', cards.id,
            'title', cards.title,
            'description', cards.description,
            'owner_id', card_owner.id,
            'owner_name', card_owner.name,
            'owner_profile_picture', card_owner.profile_picture,
            'members', COALESCE(members_data.members, '[]')
          )
        ) AS cards
    FROM 
      cards
    LEFT JOIN 
      users AS card_owner ON cards.owner_id = card_owner.id
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
        unnest(cards.members) AS member_id
      LEFT JOIN 
        users AS members ON members.id = member_id
    ) AS members_data ON true
    WHERE 
      cards.board_id = boards.id
    ) AS cards_data ON true;
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

export const boardsController = {
  "GET/boards": {
    protected: true,
    handler: getBoards
  },
  "POST/boards": {
    protected: true,
    handler: createBoard
  }
}
