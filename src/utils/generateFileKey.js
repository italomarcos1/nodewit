import crypto from "node:crypto"

export function generateFileKey(params) {
  const {
    fileKeyPrefix = 'dewit',
    fileName,
    fileType,
  } = params

  const supportedMimeTypes = [
    'jpg',
    '.jpg',
    'image/jpg',
    'jpeg',
    '.jpeg',
    'image/jpeg',
    'png',
    '.png',
    'image/png',
  ]

  console.log("fileType", fileType)
  
  if (supportedMimeTypes.includes(fileType)) {
    console.log("passou?", supportedMimeTypes.includes(fileType))
    const uuid = crypto.randomUUID();
    const fileExtension = fileName.toLowerCase().match(/\.(jpg|jpeg|png)/g)?.[0] || '.png'
    const newFileName = `${uuid}${fileExtension}`

    return {
      fileId: uuid,
      fileKey: `${fileKeyPrefix}/${newFileName}`,
      fileName: newFileName,
    }
  }

  console.log("F presign")
  // TODO: throw error InvalidFileType

  return {}
}
