import type { DocumentSeparator } from '@/types/document-layout';
import styles from './editor.module.css';

export default function SeparatorControls({ title, value, color, onChange, allowWord, standalone }: {
  title: string; value?: DocumentSeparator; color: string; onChange: (value?: DocumentSeparator) => void;
  allowWord?: boolean; standalone?: boolean;
}) {
  const current: DocumentSeparator | undefined = value ?? (standalone ? { style: 'solid' } : undefined);
  return <div className={styles.inspector}>
    <label>{title}<select value={current?.style ?? ''} onChange={event => {
      const style = event.target.value as DocumentSeparator['style'] | '';
      onChange(style ? { ...current, style } : undefined);
    }}>
      {!standalone && <option value="">Sans trait</option>}
      <option value="solid">Trait fin</option>
      <option value="dashed">Tirets</option>
      <option value="thick">Trait épais</option>
    </select></label>
    {current && <label className={styles.swatch}>Couleur du trait
      <input type="color" value={current.color ?? color} onChange={event => onChange({ ...current, color: event.target.value })} />
    </label>}
    {current && allowWord && <label>Mot ou texte à souligner
      <input maxLength={80} value={current.word ?? ''} placeholder="Zone entière" onChange={event =>
        onChange({ ...current, word: event.target.value || undefined })} />
    </label>}
  </div>;
}
