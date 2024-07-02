import { beforeEach, describe, expect, it } from "vitest";
import bcryptjs from "bcryptjs";

import { UsersInMemoryRepository } from "../../repositories/users/in-memory-repository";
import { AuthenticateUserService } from "./AuthenticateUserService";

import { InvalidCredentialsError } from "../../errors";

let usersRepository;
let sut;

describe("authenticate user", () => {
  beforeEach(() => {
    usersRepository = new UsersInMemoryRepository();
    sut = new AuthenticateUserService(usersRepository)
  })

  it("should be able to authenticate", async () => {
    const password_hash = await bcryptjs.hash("123123", 6)
    await usersRepository.createUser({
      name: "teste",
      email: "teste@g.com",
      password_hash,
      job: "teste"
    })

    const data = await sut.execute({
      email: "teste@g.com",
      password: "123123"
    })

    expect(data.token).toStrictEqual(expect.any(String))
    expect(data.user.id).toStrictEqual(expect.any(String))
  })

  it("should not be able to authenticate with wrong email", async () => {
    await expect(() =>
      sut.execute({
        email: "teste@g.com",
        password: "123456"
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it("should not be able to authenticate with wrong password", async () => {
    const password_hash = await bcryptjs.hash("123123", 6)
    await usersRepository.createUser({
      name: "teste",
      email: "teste@g.com",
      password_hash,
      job: "teste"
    })
    
    await expect(() =>
      sut.execute({
        email: "teste@g.com",
        password: "123456"
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})
