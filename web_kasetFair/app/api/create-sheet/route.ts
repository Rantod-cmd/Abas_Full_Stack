import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("google_sheet_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not connected to Google Sheets" },
        { status: 401 }
      );
    }

    const { table } = await req.json();

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    const file = await drive.files.create({
      requestBody: {
        name: "Export from Web",
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
      fields: "id",
    });

    const spreadsheetId = file.data.id!;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: { values: table },
    });

    return NextResponse.json({
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
