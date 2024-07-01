export class CreateBoardService {
  boardsRepository;

  constructor(boardsRepository) {
    this.boardsRepository = boardsRepository;
  }

  async execute({ title, owner_id }) {
    const board = await this.boardsRepository.createBoard({
      title, owner_id
    })

    return { board }
  }
}
