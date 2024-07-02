import { ForbiddenActionError, ResourceNotFoundError } from "../../errors/index.js";

export class UpdateCardService {
  cardsRepository;

  constructor(cardsRepository) {
    this.cardsRepository = cardsRepository;
  }

  async execute({ data, card_id }) {
    if ('id' in data || 'created_at' in data)
      throw new ForbiddenActionError()

    const card = await this.cardsRepository.findById(card_id)
    
    if (!card)
      throw new ResourceNotFoundError()

    const cardWasUpdated = await this.cardsRepository.updateCard({
      data,
      card_id
    })

    if (!cardWasUpdated)
      throw new Error("Error while updating card")

    return cardWasUpdated
  }
}
