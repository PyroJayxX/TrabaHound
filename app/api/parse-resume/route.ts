import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  certifications: string[];
};

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a valid JSON object.");
  }

  return trimmed.slice(start, end + 1);
}

function normalizeParsedResume(input: Partial<ParsedResume>): ParsedResume {
  return {
    name: input.name ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    skills: Array.isArray(input.skills) ? input.skills.filter(Boolean) : [],
    experience: Array.isArray(input.experience)
      ? input.experience.map((item) => ({
          company: item?.company ?? "",
          role: item?.role ?? "",
          duration: item?.duration ?? "",
          description: item?.description ?? "",
        }))
      : [],
    education: Array.isArray(input.education)
      ? input.education.map((item) => ({
          institution: item?.institution ?? "",
          degree: item?.degree ?? "",
          year: item?.year ?? "",
        }))
      : [],
    certifications: Array.isArray(input.certifications)
      ? input.certifications.filter(Boolean)
      : [],
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to parse resume.";
}

function mapModelError(error: unknown): { status: number; message: string } | null {
  const message = errorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota exceeded") ||
    lower.includes('"code":429')
  ) {
    return {
      status: 429,
      message:
        "Gemini quota exceeded for this API key/project. Enable billing or use a key/project with available quota, then retry.",
    };
  }

  if (lower.includes("api key") || lower.includes("permission_denied") || lower.includes('"code":401')) {
    return {
      status: 401,
      message: "Gemini API key is invalid or lacks permission for this model.",
    };
  }

  if (lower.includes("model") && lower.includes("not found")) {
    return {
      status: 400,
      message: "Configured Gemini model is unavailable. Update the model name and retry.",
    };
  }

  return null;
}

async function extractResumeText(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isDocx =
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx");

  if (!isPdf && !isDocx) {
    throw new Error("Only PDF and DOCX files are supported.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isPdf) {
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = (pdfParseModule.default ?? pdfParseModule) as (
      dataBuffer: Buffer,
    ) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  const docx = await mammoth.extractRawText({ buffer });
  return docx.value;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const resume = formData.get("resume");

    if (!(resume instanceof File)) {
      return NextResponse.json(
        { error: "Missing required file field: resume" },
        { status: 400 },
      );
    }

    const resumeText = await extractResumeText(resume);

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract enough text from the uploaded resume." },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      "You are a resume parser.",
      "Extract structured information from the resume text.",
      "Return ONLY a valid raw JSON object.",
      "Do not include markdown, code fences, commentary, or extra keys.",
      "Use exactly this shape:",
      "{",
      '  "name": string,',
      '  "email": string,',
      '  "phone": string,',
      '  "skills": string[],',
      '  "experience": [{ "company": string, "role": string, "duration": string, "description": string }],',
      '  "education": [{ "institution": string, "degree": string, "year": string }],',
      '  "certifications": string[]',
      "}",
      "If a value is missing, use an empty string or empty array.",
      "Resume text:",
      resumeText,
    ].join("\n");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const modelText = result.text ?? "";
    const parsed = JSON.parse(extractJsonObject(modelText)) as Partial<ParsedResume>;
    const normalized = normalizeParsedResume(parsed);

    return NextResponse.json(normalized);
  } catch (error) {
    const mapped = mapModelError(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    const message = errorMessage(error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
