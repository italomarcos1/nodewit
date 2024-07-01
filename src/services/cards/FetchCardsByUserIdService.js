export class FetchCardsByUserIdService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ user_id }) {
    const cards = await this.cardsRepository.findManyByUserId(user_id);
    
    return { cards };
  }
}
