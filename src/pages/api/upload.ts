import type { APIRoute } from "astro";
import fs from "fs/promises";
import path from "path";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicFolderPath = path.resolve(process.cwd(), "public");
    const filePath = path.join(publicFolderPath, "logo.png");
    await fs.writeFile(filePath, buffer);
    return new Response(JSON.stringify({ success: true, path: "/logo.png" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error handling file upload:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

export const GET: APIRoute = async () => {
  try {
    const publicFolderPath = path.resolve(process.cwd(), "public");
    const filePath = path.join(publicFolderPath, "logo.png");
    const fileBuffer = await fs.readFile(filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return new Response(JSON.stringify({ error: "Logo not found" }), {
      status: 404,
    });
  }
};
