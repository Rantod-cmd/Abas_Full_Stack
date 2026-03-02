"use server";

import { google } from "googleapis";
import { Readable } from "node:stream";

type CreateSheetResult = {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
};

export async function createSheetFromCsv(accessToken: string, csvContent: string, fileName: string): Promise<CreateSheetResult> {
  if (!accessToken) {
    return { success: false, error: "Missing Google access token." };
  }
  if (!csvContent) {
    return { success: false, error: "No CSV data to export." };
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.create({
      requestBody: {
        name: fileName || "Financial Plan",
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
      media: {
        mimeType: "text/csv",
        body: Readable.from([csvContent]),
      },
      fields: "id, webViewLink",
    });

    const fileId = response.data.id ?? undefined;
    const webViewLink = response.data.webViewLink ?? (fileId ? `https://docs.google.com/spreadsheets/d/${fileId}` : undefined);

    return {
      success: true,
      fileId,
      url: webViewLink,
    };
  } catch (error) {
    console.error("Failed to create Google Sheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error while creating Google Sheet.",
    };
  }
}
