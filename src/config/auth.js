import { env } from "../env/index.js";

export const authConfig = {
  secret: env.SECRET,
  expiresIn: "3d"
}
