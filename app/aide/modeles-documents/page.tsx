import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { tourChapters } from '@/lib/document-engine/tour-steps';

const directory = 'aide/modeles-documents';

export default function DocumentVideoHelp() {
  const chapters = tourChapters.filter(({ id }) =>
    ['mp4', 'vtt', 'jpg'].every(ext => existsSync(join(process.cwd(), 'public', directory, `${id}.${ext}`))));

  return <main className="mx-auto max-w-4xl space-y-8 px-5 py-10">
    <h1 className="text-2xl font-semibold">Personnaliser un bulletin de paie</h1>
    <Link href="/documents/editeur/PAYSLIP" className="inline-block text-sm underline">Ouvrir l’éditeur</Link>
    {chapters.length === 0 && <p>Le guide pas à pas est disponible depuis le bouton Aide de l’éditeur.</p>}
    {chapters.map(({ id, title }) => {
      const asset = `/${directory}/${id}`;
      return <section key={id} id={id} className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <video className="aspect-video w-full rounded-lg bg-black" controls playsInline preload="none"
          poster={`${asset}.jpg`} aria-label={title}>
          <source src={`${asset}.mp4`} type="video/mp4" />
          <track kind="captions" src={`${asset}.vtt`} srcLang="fr" label="Français" default />
        </video>
      </section>;
    })}
  </main>;
}
