import { ResourceNotFoundError } from "../../errors/index.js";

export class DeleteBoardService {
  boardsRepository;

  constructor(boardsRepository) {
    this.boardsRepository = boardsRepository;
  }
  
  async execute(board_id) {
    const boardHasBeenDeleted = await this.boardsRepository.deleteBoard(board_id);

    if (!boardHasBeenDeleted)
      throw new ResourceNotFoundError()

    return true;
  }
}
