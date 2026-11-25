import type { DocumentSeparator } from '@/types/document-layout';

export default function SeparatorText({ text, separator }: { text: string; separator?: DocumentSeparator }) {
  const word = separator?.word?.trim();
  const start = word ? text.indexOf(word) : -1;
  if (!separator || !word || start < 0) return text;
  return <>{text.slice(0, start)}<span style={{
    textDecorationLine: 'underline',
    textDecorationStyle: separator.style === 'dashed' ? 'dashed' : 'solid',
    textDecorationThickness: separator.style === 'thick' ? '2pt' : '.75pt',
    textDecorationColor: separator.color ?? 'var(--doc-line, currentColor)',
    textUnderlineOffset: '0.2em',
  }}>{word}</span>{text.slice(start + word.length)}</>;
}
