import { beforeAll, describe, expect, it } from "vitest";
import { UsersInMemoryRepository } from "../../repositories/users/in-memory-repository";
import { UpdateUserService } from "./UpdateUserService";
import { ForbiddenActionError, ResourceNotFoundError } from "../../errors/index.js";

let usersRepository;
let sut;

describe("update user", () => {
  beforeAll(() => {
    usersRepository = new UsersInMemoryRepository()
    sut = new UpdateUserService(usersRepository)
  })

  it("should be able to update user", async () => {
    const name = "abcdef";
    const email = "abcdef@g.com";

    const user = await usersRepository.createUser({
      name: "teste",
      email: "teste@g.com",
      password_hash: "teste",
      job: "teste"
    })

    await sut.execute({
      data: { name },
      user_id: user.id
    })

    const updatedUser = await usersRepository.findById(user.id)

    expect(updatedUser.name).toStrictEqual(name)

    await sut.execute({
      data: { email },
      user_id: user.id
    })

    const updatedUserTwo = await usersRepository.findById(user.id)

    expect(updatedUserTwo.email).toStrictEqual(email)
  })

  it("should not be able to accept id field in data object", async () => {
    await expect(() =>
      sut.execute({
        data: { id: "" },
        user_id: ""
      })
    ).rejects.toBeInstanceOf(ForbiddenActionError)
  })

  it("should not be able to edit a user that doesn't exist", async () => {
    await expect(() =>
      sut.execute({
        data: { name: "" },
        user_id: ""
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
