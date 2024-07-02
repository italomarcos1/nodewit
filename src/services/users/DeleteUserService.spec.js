import { beforeAll, describe, expect, it } from "vitest";
import { UsersInMemoryRepository } from "../../repositories/users/in-memory-repository";
import { DeleteUserService } from "./DeleteUserService";
import { ResourceNotFoundError } from "../../errors";

let usersRepository;
let sut;

describe("delete user", () => {
  beforeAll(() => {
    usersRepository = new UsersInMemoryRepository()
    sut = new DeleteUserService(usersRepository)
  })

  it("should be able to delete an user", async () => {
    const user = await usersRepository.createUser({
      name: "teste",
      email: "teste@g.com",
      password_hash: "teste",
      job: "teste"
    })

    const result = await sut.execute(user.id)

    expect(result).toBe(true)
  })

  it("should not be able to delete an user which doesn't exist", async () => {
    await expect(() => 
      sut.execute("123123")
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
