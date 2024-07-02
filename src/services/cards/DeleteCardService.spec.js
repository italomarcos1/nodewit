import { beforeAll, describe, expect, it } from "vitest";
import { CardsInMemoryRepository } from "../../repositories/cards/in-memory-repository";
import { DeleteCardService } from "./DeleteCardService.js";
import { ResourceNotFoundError } from "../../errors";

let cardsRepository;
let sut;

describe("delete card", () => {
  beforeAll(() => {
    cardsRepository = new CardsInMemoryRepository()
    sut = new DeleteCardService(cardsRepository)
  })

  it("should be able to delete an card", async () => {
    const card = await cardsRepository.createCard({
      title: "teste",
      description: "teste123",
    })

    const result = await sut.execute(card.id)

    expect(result).toBe(true)
  })

  it("should not be able to delete an card which doesn't exist", async () => {
    await expect(() => 
      sut.execute("123123")
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
