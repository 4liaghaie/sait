import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const translationsPath = path.join(process.cwd(), "src", "lib", "translations.js");

const template = (obj) =>
  `export const translations = ${JSON.stringify(obj, null, 2)};\n`;

export async function GET() {
  try {
    const raw = fs.readFileSync(translationsPath, "utf-8");
    const match = raw.match(/export const translations = (.*);/s);
    const parsed = match ? Function("return (" + match[1] + ")")() : {};
    return NextResponse.json({ translations: parsed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || typeof body.translations !== "object") {
      return NextResponse.json({ error: "Missing translations object" }, { status: 400 });
    }
    fs.writeFileSync(translationsPath, template(body.translations));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
