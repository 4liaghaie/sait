import ReferencesList from "@/components/ReferencesList";
import { apiUrl } from "@/lib/api";
import { cookies } from "next/headers";

async function getReferencesData() {
  const lang = cookies().get("lang")?.value || "en";
  const res = await fetch(apiUrl(`/api/references?populate=*&lang=${lang}`), {
    cache: "no-store",
    headers: { "Accept-Language": lang },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch references");
  }
  return res.json();
}

export default async function References() {
  const data = await getReferencesData();
  const references = data.data;

  return (
    <main className="container mx-auto px-4 py-10 min-h-screen">
      <ReferencesList references={references} />
    </main>
  );
}
