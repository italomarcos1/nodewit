import crypto from "node:crypto"
import { UnsupportedFileTypeError } from "../errors/index.js"
import { supportedMimeTypes } from "./supportedMimeTypes.js"

export function generateFileKey(params) {
  try {
    const {
      fileKeyPrefix = 'dewit',
      fileName,
      fileType,
    } = params
    
    if (supportedMimeTypes.includes(fileType)) {
      const uuid = crypto.randomUUID();
      const fileExtension = fileName.split('.').at(-1)
      
      if (!fileExtension)
        throw new UnsupportedFileTypeError()
      
      const newFileName = `${uuid}.${fileExtension}`

      return {
        fileId: uuid,
        fileKey: `${fileKeyPrefix}/${newFileName}`,
        fileName: newFileName,
      }
    }

    throw new UnsupportedFileTypeError()
  } catch (e) {
    throw new Error("Invalid file")
  }
}
