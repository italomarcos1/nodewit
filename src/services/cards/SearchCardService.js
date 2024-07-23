export class SearchCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute(query) {
    const results = await this.cardsRepository.searchCard(query);

    return results;
  }
}
