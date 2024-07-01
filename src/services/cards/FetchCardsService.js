export class FetchCardsService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute() {
    const cards = await this.cardsRepository.findMany();
    
    return { cards };
  }
}
