import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  return (
    <main
      id="contenu-principal"
      tabIndex={-1}
      className="swagger-light min-h-screen bg-[#f7faf9] text-[#081c1b] p-6 md:p-10"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-700">API</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Swagger</h1>
          <p className="max-w-2xl text-sm text-slate-700">
            Consultez ici la documentation interactive de l’API Cuisine du Monde Nantes.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
          <SwaggerUI url="/api/docs" />
        </div>
      </div>
    </main>
  );
}
