// ============================================================================
// 📁 components/contracts/contract-editor/extensions.ts
// Extensions TipTap propres au module contrats :
//  • Variable   : jeton {cle} inséré depuis le catalogue (nœud inline atomique)
//  • PageBreak  : saut de page
//  • GapHighlight : surligne les « ………… » / « _____ » du contrat collé pour
//                   que le client les remplace en un clic par une variable
// ============================================================================
import { Node, Extension, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const Variable = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-var'),
        renderHTML: (attrs) => ({ 'data-var': attrs.key }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-var]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'ct-var' }), `{${node.attrs.key}}`];
  },

  renderText({ node }) {
    return `{${node.attrs.key}}`;
  },

  // Taper {salaire_net} transforme automatiquement le texte en variable
  addInputRules() {
    return [
      nodeInputRule({
        find: /\{([a-z][a-z0-9_]{1,59})\}$/,
        type: this.type,
        getAttributes: (match) => ({ key: match[1] }),
      }),
    ];
  },
});

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-page-break]' }];
  },
  renderHTML() {
    return ['div', { 'data-page-break': '', class: 'ct-pagebreak' }, 'Saut de page'];
  },
});

/** Suite de points/points de suspension/underscores = champ à compléter dans le contrat d'origine. */
export const GAP_REGEX = /(?:[….]){4,}|_{4,}/g;
const gapKey = new PluginKey('ctGap');

export const GapHighlight = Extension.create({
  name: 'gapHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: gapKey,
        props: {
          decorations(state) {
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              GAP_REGEX.lastIndex = 0;
              let m: RegExpExecArray | null;
              while ((m = GAP_REGEX.exec(node.text))) {
                const from = pos + m.index;
                const to = from + m[0].length;
                decos.push(
                  Decoration.inline(from, to, {
                    class: 'ct-gap',
                    'data-from': String(from),
                    'data-to': String(to),
                    title: 'Cliquez pour choisir la variable à placer ici',
                  }),
                );
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

/** Trouve tous les champs à compléter du document (positions courantes). */
export function findGaps(doc: any): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  doc.descendants((node: any, pos: number) => {
    if (!node.isText || !node.text) return;
    GAP_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = GAP_REGEX.exec(node.text))) out.push({ from: pos + m.index, to: pos + m.index + m[0].length });
  });
  return out;
}

/**
 * Nettoyage d'un texte collé depuis un PDF : recolle les lignes coupées au
 * milieu d'une phrase (la ligne précédente ne finit pas par une ponctuation
 * ET la suivante commence par une minuscule). Ne touche qu'aux paragraphes
 * de premier niveau, conserve gras/italique.
 */
export function joinBrokenLines(docJson: any): any {
  const content: any[] = [];
  const endsSentence = (p: any) => {
    const last = [...(p.content || [])].reverse().find((n: any) => n.type === 'text');
    return !last || /[.:;!?»)\]]\s*$/.test(last.text || '');
  };
  const startsLower = (p: any) => {
    const first = (p.content || []).find((n: any) => n.type === 'text');
    return !!first && /^[a-zà-ÿ]/.test(first.text || '');
  };
  for (const node of docJson.content || []) {
    const prev = content[content.length - 1];
    if (
      node.type === 'paragraph' && prev && prev.type === 'paragraph' &&
      (prev.content || []).length && (node.content || []).length &&
      !endsSentence(prev) && startsLower(node)
    ) {
      prev.content = [...prev.content, { type: 'text', text: ' ' }, ...node.content];
    } else {
      content.push(JSON.parse(JSON.stringify(node)));
    }
  }
  return { ...docJson, content };
}