import { beforeAll, describe, expect, it } from "vitest";
import { UsersInMemoryRepository } from "../../repositories/users/in-memory-repository";
import { FetchUsersService } from "./FetchUsersService";

let usersRepository;
let sut;

describe("fetch users", () => {
  beforeAll(() => {
    usersRepository = new UsersInMemoryRepository()
    sut = new FetchUsersService(usersRepository)
  })

  it("should be able to fetch users", async () => {
    await usersRepository.createUser({
      name: "teste",
      email: "teste@g.com",
      password_hash: "123123",
      job: "teste"
    })

    const { users } = await sut.execute()

    expect(users).toEqual([
      expect.objectContaining({ email: "teste@g.com" })
    ])
  })
})
