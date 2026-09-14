'use client';

export function FeatureBento() {
  return (
    <section className="bg-[#050607] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#FAFAFA] sm:text-[38px]">
          Tout ce qu'il faut pour gérer la paie, sans tableur.
        </h2>
        <p className="mt-4 max-w-lg text-[16px] text-[#8B8F98]">
          Chaque module remplace un fichier Excel ou une démarche manuelle par
          un flux qui se met à jour automatiquement.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Grande carte — le point fort du produit */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0C0F] p-8 transition-colors hover:border-white/[0.14] md:col-span-2 md:row-span-2">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D4A548]/[0.06] blur-3xl" />
            <h3 className="text-[20px] font-medium text-[#FAFAFA]">
              Bulletins générés automatiquement
            </h3>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[#8B8F98]">
              Absences, primes et heures supplémentaires du mois sont pris en
              compte sans ressaisie. 500 fiches sont calculées et exportées en
              moins de 3 minutes.
            </p>
            <div className="mt-8 space-y-2">
              {[
                { label: 'Marie N.', role: 'Comptable', status: 'Généré' },
                { label: 'Paul K.', role: 'Technicien', status: 'Généré' },
                { label: 'Sarah B.', role: 'Assistante RH', status: 'En cours' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px]"
                >
                  <div className="flex flex-col">
                    <span className="text-[#FAFAFA]">{row.label}</span>
                    <span className="text-[#8B8F98]">{row.role}</span>
                  </div>
                  <span
                    className={
                      row.status === 'Généré'
                        ? 'text-[#D4A548]'
                        : 'text-[#8B8F98]'
                    }
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <FeatureCard
            title="Congés & absences"
            description="Soldes calculés automatiquement, demandes validées en un clic par le responsable."
          />
          <FeatureCard
            title="Export CNSS prêt à déposer"
            description="La déclaration CNSS et la TUS sont préparées dans le format attendu, chaque mois."
          />
          <FeatureCard
            title="Espace employé mobile"
            description="Chaque employé consulte ses bulletins et pose ses congés depuis son téléphone."
            wide
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  wide = false,
}: {
  title: string;
  description: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-[#0B0C0F] p-6 transition-colors hover:border-white/[0.14] ${
        wide ? 'md:col-span-1' : ''
      }`}
    >
      <h3 className="text-[16px] font-medium text-[#FAFAFA]">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[#8B8F98]">
        {description}
      </p>
    </div>
  );
}