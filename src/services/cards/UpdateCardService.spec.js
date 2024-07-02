import { beforeAll, describe, expect, it } from "vitest";
import { CardsInMemoryRepository } from "../../repositories/cards/in-memory-repository.js";
import { UpdateCardService } from "./UpdateCardService.js";
import { ForbiddenActionError, ResourceNotFoundError } from "../../errors/index.js";

let cardsRepository;
let sut;

describe("update card", () => {
  beforeAll(() => {
    cardsRepository = new CardsInMemoryRepository()
    sut = new UpdateCardService(cardsRepository)
  })

  it("should be able to update card", async () => {
    const title = "abcdef";
    const description = "abcdef fedcba";

    const card = await cardsRepository.createCard({
      title: "teste",
      description: "teste@g.com",
    })

    await sut.execute({
      data: { title },
      card_id: card.id
    })

    const updatedCard = await cardsRepository.findById(card.id)

    expect(updatedCard.title).toStrictEqual(title)

    await sut.execute({
      data: { description },
      card_id: card.id
    })

    const updatedCardTwo = await cardsRepository.findById(card.id)

    expect(updatedCardTwo.description).toStrictEqual(description)
  })

  it("should not be able to accept id field in data object", async () => {
    await expect(() =>
      sut.execute({
        data: { id: "" },
        card_id: ""
      })
    ).rejects.toBeInstanceOf(ForbiddenActionError)
  })

  it("should not be able to edit a card that doesn't exist", async () => {
    await expect(() =>
      sut.execute({
        data: { title: "" },
        card_id: ""
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
