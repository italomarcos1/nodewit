import { beforeAll, describe, expect, it } from "vitest";
import { BoardsInMemoryRepository } from "../../repositories/boards/in-memory-repository.js";
import { UpdateBoardService } from "./UpdateBoardService.js";
import { ForbiddenActionError, ResourceNotFoundError } from "../../errors/index.js";

let boardsRepository;
let sut;

describe("update board", () => {
  beforeAll(() => {
    boardsRepository = new BoardsInMemoryRepository()
    sut = new UpdateBoardService(boardsRepository)
  })

  it("should be able to update board", async () => {
    const title = "abcdef";
    const owner_id = "abcdef fedcba";

    const board = await boardsRepository.createBoard({
      title: "teste",
      owner_id: "teste@g.com",
    })

    await sut.execute({
      data: { title },
      board_id: board.id
    })

    const updatedBoard = await boardsRepository.findById(board.id)

    expect(updatedBoard.title).toStrictEqual(title)

    await sut.execute({
      data: { owner_id },
      board_id: board.id
    })

    const updatedBoardTwo = await boardsRepository.findById(board.id)

    expect(updatedBoardTwo.owner_id).toStrictEqual(owner_id)
  })

  it("should not be able to accept id field in data object", async () => {
    await expect(() =>
      sut.execute({
        data: { id: "" },
        Board_id: ""
      })
    ).rejects.toBeInstanceOf(ForbiddenActionError)
  })

  it("should not be able to edit a board that doesn't exist", async () => {
    await expect(() =>
      sut.execute({
        data: { title: "" },
        Board_id: ""
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
