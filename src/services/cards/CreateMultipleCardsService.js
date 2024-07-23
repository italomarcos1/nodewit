export class CreateMultipleCardsService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ cards }) {
    // TODO: validate owner_id e board_id?
    
    const card = await this.cardsRepository.createMultipleCards({
      cards
    })

    if (!card)
      throw Error("Erro ao criar cards")

    return card
  }
}
