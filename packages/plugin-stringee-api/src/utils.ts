import * as graph from "fbgraph";
import * as FormData from "form-data";
import { IModels } from "./connectionResolver";
import fetch from "node-fetch"; // Ensure this is imported
import { getEnv } from "@erxes/api-utils/src/core";
import { generateStringeeRestToken } from "./stringeeService";
import * as https from "https";
import { error } from "console";


export const uploadFileFromUrl = async (
  mediaId: string,
  mimeType: string,
  subdomain: string,
  accessToken: string
): Promise<any> => {
  try {
    const response = await graph.get(mediaId, accessToken);

    const mediaUrl = response.url;

    const getMedia = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!getMedia.ok) {
      throw new Error(
        `Failed to fetch media: ${getMedia.status} ${getMedia.statusText}`
      );
    }

    const buffer = Buffer.from(await getMedia.arrayBuffer());

    if (!buffer) {
      throw new Error("Failed to convert media response to buffer");
    }

    const domain = getEnv({
      name: "DOMAIN",
      subdomain,
      defaultValue: "http://localhost:4000"
    });
    const uploadUrl = domain.includes("zrok")
      ? `${domain}/pl:core/upload-file`
      : `${domain}/gateway/pl:core/upload-file`;

    const formData = new FormData();
    const fileExtension = mimeType.split("/")[1];

    formData.append("file", buffer, `media.${fileExtension}`);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    const responseBody = await uploadResponse.text();

    const contentType = uploadResponse.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const jsonData = JSON.parse(responseBody);
      return jsonData;
    } else {
      return responseBody;
    }
  } catch (error) {
    throw new Error(
      `Failed to retrieve whatsapp account details: ${error.message}`
    );
  }
};

export const downloadAndUploadStringeeRecording = async (
  callId: string,
  subdomain: string
): Promise<any> => {
  try {
    // Delay 5 giây trước khi download file
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tải file ghi âm từ Stringee
    const token = generateStringeeRestToken();
    const options: https.RequestOptions = {
      method: "GET",
      hostname: "api.stringee.com",
      path: `/v1/call/recording/${callId}`,
      headers: { "X-STRINGEE-AUTH": token },
    };

    const response = await new Promise<{ statusCode?: number; body: Buffer }>((resolve, reject) => {
      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: Buffer.concat(chunks)
          });
        });
      });
      req.on("error", reject);
      req.end();
    });

    console.log("Stringee recording response body:", response.body);
    if (response.statusCode !== 200) {
      throw new Error(`Failed to download recording: ${response.statusCode}`);
    }

    // Upload file lên server
    const domain = getEnv({
      name: "DOMAIN",
      subdomain,
      defaultValue: "http://localhost:4000"
    });
    const uploadUrl = domain.includes("zrok")
      ? `${domain}/pl:core/upload-file`
      : `${domain}/upload-file`;

    const formData = new FormData();
    formData.append("file", response.body, `recording_${callId}.mp3`);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });


    const responseBody = await uploadResponse.text();
    const contentType = uploadResponse.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const jsonData = JSON.parse(responseBody);
      return jsonData;
    } else {
      return responseBody;
    }
  } catch (error) {
    console.error("Error downloading and uploading Stringee recording:", error);
    throw new Error(`Failed to download and upload Stringee recording: ${error.message}`);
  }
};
