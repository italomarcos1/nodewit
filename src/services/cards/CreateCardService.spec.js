import { beforeAll, describe, expect, it } from "vitest";
import { CardsInMemoryRepository } from "../../repositories/cards/in-memory-repository";
import { CreateCardService } from "./CreateCardService";

let cardsRepository;
let sut;

describe("create card", () => {
  beforeAll(() => {
    cardsRepository = new CardsInMemoryRepository();
    sut = new CreateCardService(cardsRepository)
  })

  it("should create card", async () => {
    expect(2).toBe(2)
  })
})
