// app/_not-found/page.tsx
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for does not exist.</p>
    </div>
  );
}
