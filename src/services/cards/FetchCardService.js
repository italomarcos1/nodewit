export class FetchCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute(card_id) {
    const card = await this.cardsRepository.getCardInfo(card_id);
    
    return { card };
  }
}
