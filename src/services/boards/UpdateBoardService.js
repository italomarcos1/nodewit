import { ForbiddenActionError, ResourceNotFoundError } from "../../errors/index.js";

export class UpdateBoardService {
  boardsRepository;

  constructor(boardsRepository) {
    this.boardsRepository = boardsRepository;
  }

  async execute({ data, board_id }) {
    if ('id' in data || 'created_at' in data)
      throw new ForbiddenActionError()

    const board = await this.boardsRepository.findById(board_id)
    
    if (!board)
      throw new ResourceNotFoundError()

    const updatedBoard = await this.boardsRepository.updateBoard({
      data,
      board_id
    })

    if (!updatedBoard)
      throw new Error("Error while updating board")

    return updatedBoard
  }
}
