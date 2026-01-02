import ReferencesList from "@/components/ReferencesList";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import { cookies } from "next/headers";

async function getReferencesData(lang) {
  try {
    const res = await fetch(apiUrl(`/api/references?populate=*&lang=${lang}`), {
      cache: "no-store",
      headers: { "Accept-Language": lang },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch references");
    }
    const data = await parseJsonResponse(res);
    return data.data || [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Could not fetch references:", error.message);
    }
    return [];
  }
}

export default async function References() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";
  const references = await getReferencesData(lang);

  return (
    <main className="container mx-auto px-4 py-10 min-h-screen">
      <ReferencesList references={references} />
    </main>
  );
}
