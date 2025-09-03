import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import config from "../config/index";

// DigitalOcean Spaces Config
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: config.digitalOcean.endpoint!,
  credentials: {
    accessKeyId: config.digitalOcean.accessKey as string,
    secretAccessKey: config.digitalOcean.secretKey as string,
  },
});

export async function deleteImageFromDigitalOcean(imageUrl: string): Promise<boolean> {
  try {
    const bucketName = config.digitalOcean.bucket!;
    const key = imageUrl.split(`${bucketName}/`)[1];

    if (!key) {
      console.warn(` Could not extract key from URL: ${imageUrl}`);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);

    console.log(` Deleted: ${key}`);
    return true;
  } catch (err: any) {
    console.error(" Delete failed:", err.message || err);
    return false;
  }
}


export async function deleteImagesFromDigitalOcean(
  imageUrls: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const url of imageUrls) {
    const isDeleted = await deleteImageFromDigitalOcean(url);
    if (isDeleted) {
      success.push(url);
    } else {
      failed.push(url);
    }
  }

  return { success, failed };
}




// // Example usage:
// const urls = [
//   "https://nyc3.digitaloceanspaces.com/freashstart/fresh-start/1756573312345_7cbf4392-ba67-4c62-84cc-ccbcfdfaa510_test.jpg",
//   "https://nyc3.digitaloceanspaces.com/freashstart/fresh-start/1756573312349_c50b01aa-f87d-4302-b13f-06803840150c_test_(4).jpg"
// ];

// (async () => {
//   for (const url of urls) {
//     await deleteImageFromSpaces(url);
//   }
// })();
 

// // Example usage:
// const urls = [
//   "https://nyc3.digitaloceanspaces.com/freashstart/fresh-start/1756573312345_7cbf4392-ba67-4c62-84cc-ccbcfdfaa510_test.jpg",
//   "https://nyc3.digitaloceanspaces.com/freashstart/fresh-start/1756573312349_c50b01aa-f87d-4302-b13f-06803840150c_test_(4).jpg"
// ];

// (async () => {
//   for (const url of urls) {
//     await deleteImageFromSpaces(url);
//   }
// })();
