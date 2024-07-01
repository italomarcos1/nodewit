export class FetchCardsByBoardIdService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ board_id }) {
    const cards = await this.cardsRepository.findManyByBoardId(board_id);
    
    return { cards };
  }
}
