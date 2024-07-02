import { beforeAll, describe, expect, it } from "vitest";
import { BoardsInMemoryRepository } from "../../repositories/boards/in-memory-repository";
import { DeleteBoardService } from "./DeleteBoardService";
import { ResourceNotFoundError } from "../../errors";

let boardsRepository;
let sut;

describe("delete board", () => {
  beforeAll(() => {
    boardsRepository = new BoardsInMemoryRepository()
    sut = new DeleteBoardService(boardsRepository)
  })

  it("should be able to delete an board", async () => {
    const board = await boardsRepository.createBoard({
      title: "teste",
      owner_id: "213123132132",
    })

    const result = await sut.execute(board.id)

    expect(result).toBe(true)
  })

  it("should not be able to delete an board which doesn't exist", async () => {
    await expect(() => 
      sut.execute("123123")
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
