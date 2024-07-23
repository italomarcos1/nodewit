export class FetchBoardsService {
  boardsRepository;

  constructor(boardsRepository) {
    this.boardsRepository = boardsRepository;
  }

  async execute() {
    const boards = await this.boardsRepository.findMany();
    
    return { boards };
  }
}
