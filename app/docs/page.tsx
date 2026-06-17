import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#081c1b] text-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300">API</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Swagger</h1>
          <p className="max-w-2xl text-sm text-slate-200/80">
            Consultez ici la documentation interactive de l’API Cuisine du Monde Nantes.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/20">
          <SwaggerUI url="/api/docs" />
        </div>
      </div>
    </main>
  );
}
