import { parseUrl } from "@smithy/url-parser";
import { Hash } from "@smithy/hash-node";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { HttpRequest } from "@smithy/protocol-http";
import { formatUrl } from "@aws-sdk/util-format-url"

import { env } from "../../env/index.js";
import { UnsupportedFileTypeError } from "../../errors/index.js";
import { generateFileKey } from "../../utils/generateFileKey.js";

export class GetPresignedUrl {
  async execute({ fileName, fileType, method = "PUT" }) {
    try {
      const {
        fileId, fileKey, fileName: generatedFileName,
      } = generateFileKey({
        fileKeyPrefix: 'dewit',
        fileType: fileType,
        fileName,
      })
    
      if (!fileId)
        throw new UnsupportedFileTypeError()

      const fileUrl = method === "PUT" ? fileKey : fileName;
        
      const s3ObjectUrl = parseUrl(`https://${env.S3_BUCKET_URL}/${fileUrl}`)
    
      const presignerOptions = {
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        region: env.S3_REGION,
        sha256: Hash.bind(null, 'sha256'),
      }
    
      const presigner = new S3RequestPresigner(presignerOptions)
    
      const presignedParams = await presigner.presign(
        new HttpRequest({ ...s3ObjectUrl, method }),
        { expiresIn: 300 },
      )

      const url = formatUrl(presignedParams)
    
      const response = { url, fileName: generatedFileName };

      return response;
    } catch (err) {
      throw Error("Erro ao gerar URL de envio")
    }
  }
}
