import { ResourceNotFoundError } from "../../errors/index.js";

export class DeleteCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }
  
  async execute(card_id) {
    const cardHasBeenDeleted = await this.cardsRepository.deleteCard(card_id);

    if (!cardHasBeenDeleted)
      throw new ResourceNotFoundError()

    return true;
  }
}
