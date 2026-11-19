const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const articles = require("../lib/assistant/knowledge.json");
let overrides = {},
  effects = [],
  refs = [],
  index = 0,
  states = [],
  closed = 0,
  launched = "",
  calls = 0;
const caps = {
  assistantMode: "INTEGRE",
  helpOnly: true,
  analysisAvailable: false,
  remainingAnalyses: null,
  monthlyAnalyses: null,
  guideEnabled: true,
  disabledGuides: [],
  retentionDays: 90,
};
const context = {
  open: true, helpOpen:true,
  actor: { id: "u", companyId: "c", role: "ADMIN" },
  identity: "u:c:ADMIN",
  caps,
  error: "",
  close() {
    closed++;
  },
  refresh: async () => {},
  adapter: {
    help: async () => articles,
    suggestions: async () => [],
    list: async () => [],
    chat: async (_input, event) => {
      calls++;
      event({
        type: "meta",
        data: { conversationId: "conversation", messageId: "answer" },
      });
      event({ type: "text", data: { text: "Réponse reliée" } });
      event({
        type: "done",
        data: {
          messageId: "answer",
          payload: { source: "help:payroll", refusal: false },
        },
      });
    },
  },
};
const hooks = {
  ...React,
  useEffect(fn) { effects.push(fn); },
  useState(initial) {
    const n = index++;
    states[n] = Object.hasOwn(overrides, n) ? overrides[n] : initial;
    return [
      states[n],
      (value) => {
        states[n] = typeof value === "function" ? value(states[n]) : value;
      },
    ];
  },
  useRef: (value) => { const ref = { current: value }; refs.push(ref); return ref; },
};
function load(file, stubs) {
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
  )((name) => (name in stubs ? stubs[name] : require(name)), m, m.exports);
  return m.exports;
}
const catalog = load("lib/guides/catalog.ts", {});
const guide = {
  enabled: true,
  active: false,
  loading: false,
  error: false,
  hasFeature: () => true,
  start: (id) => (launched = id),
};
const { AssistantPanel } = load("components/assistant/AssistantPanel.tsx", {
  "@/lib/assistant/typing": load("lib/assistant/typing.ts", {}),
  react: hooks,
  "next/link": {
    default: ({ children, ...props }) =>
      React.createElement("a", props, children),
    __esModule: true,
  },
  "./AssistantWindow": {
    AssistantWindow: ({ children, open }) =>
      open ? React.createElement("div", null, children) : null,
    __esModule: true,
  },
  "./AnalysisComposer": {AnalysisComposer:()=>null},
  "./AssistantProvider": { useAssistant: () => context },
  "@/components/guides/GuideProvider": { useGuide: () => guide },
  "@/lib/guides/catalog": catalog,
  "@/lib/assistant/help": { normalizeHelp: (text) => text.toLowerCase() },
  "@/lib/demo/config": { DEMO_MODE: false },
});
function tree(values = {}) {
  effects = []; refs = [];
  overrides = {
    1: articles.filter((a) => a.roles.includes(context.actor.role)),
    2: ["Comment faire la paie ?"],
    ...values,
  };
  index = 0;
  return AssistantPanel({kind:values[0]==='chat'||values[0]==='history'?'assistant':'help'});
}
function walk(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = walk(child, predicate);
    if (found) return found;
  }
  return null;
}
async function main() {
  let node = tree(),
    html = renderToStaticMarkup(node);
  assert.ok(html.includes("Être guidé sur mon écran"));
  assert.ok(html.includes("Créer une offre"));
  assert.ok(!html.includes("<textarea"));
  assert.ok(!html.includes("Rubriques de l?assistant"));
  const launch = walk(
    node,
    (n) =>
      n.type === "button" &&
      JSON.stringify(n.props.children).includes("Faire la paie"),
  );
  launch.props.onClick();
  assert.equal(launched, "payroll-create");
  assert.equal(closed, 1);
  context.actor.role = "EMPLOYEE";
  html = renderToStaticMarkup(tree());
  assert.ok(!html.includes("Être guidé sur mon écran"));
  assert.ok(!html.includes("Créer une offre"));
  assert.ok(html.includes("Consulter mes bulletins"));
  context.actor.role = "ADMIN";
  context.caps = { ...caps, assistantMode: "OFF" };
  html = renderToStaticMarkup(tree({ 0: "chat" }));
  assert.ok(html.includes("Le chat est désactivé"));
  assert.ok(!html.includes("<textarea"));
  assert.ok(renderToStaticMarkup(tree()).includes("Être guidé sur mon écran"));
  context.caps = { ...caps, guideEnabled: false };
  guide.enabled = false;
  html = renderToStaticMarkup(tree());
  assert.ok(!html.includes("Être guidé sur mon écran"));
  guide.enabled = true;
  context.caps = caps;
  html = renderToStaticMarkup(tree({ 0: "chat" }));
  assert.ok(html.includes("Bonjour ! Que souhaitez-vous faire aujourd’hui ?"));
  assert.ok(html.includes('aria-label="Questions suggérées"'));
  assert.ok(html.includes('aria-label="Messages de la conversation"'));
  assert.ok(html.includes('aria-label="Historique des conversations"'));
  assert.ok(!html.includes('aria-label="Rubriques de l’assistant"'));
  context.caps = { ...caps, assistantMode: "IA_AVANCEE" };
  node = tree({ 0: "chat", 7: "Comment faire la paie ?" });
  const form = walk(node, (n) => n.type === "form");
  form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(calls, 1, "double submit must send once");
  assert.equal(states[4].at(-1).text, "Réponse reliée");
  assert.equal(states[4].at(-1).id, "answer");
  context.caps = caps;
  html = renderToStaticMarkup(
    tree({
      0: "history",
      3: [
        {
          id: "c",
          title: "Préparer la paie",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      11: "c",
    }),
  );
  assert.ok(html.includes("Supprimer définitivement cette conversation"));
  assert.ok(html.includes("90 jours"));
  // A new conversation must not retain the previous conversation's scroll offset.
  tree({ 0: "chat" });
  const viewport = { scrollTop: 240, getBoundingClientRect: () => ({ top: 100 }), querySelector: () => ({ getBoundingClientRect: () => ({ top: 220 }) }) };
  refs[2].current = { parentElement: viewport };
  effects.at(-1)();
  assert.equal(viewport.scrollTop, 0);
  // Reveal the beginning of a response, then preserve the reader's position during streaming.
  tree({ 0: "chat", 4: [{ id: "q", role: "USER", text: "Question" }, { id: "a", role: "ASSISTANT", text: "Long response" }], 5: "conversation" });
  refs[2].current = { parentElement: viewport };
  effects.at(-1)();
  assert.equal(viewport.scrollTop, 108);
  viewport.scrollTop = 60;
  effects.at(-1)();
  assert.equal(viewport.scrollTop, 60, "Streaming must not pull the reader to the end");
  context.error = "Connexion interrompue";
  html = renderToStaticMarkup(tree());
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes("Réessayer la connexion"));
  console.log(
    "PASS: vues Aide/Conversation/Historique, rôles, OFF avec guides, interrupteur guides, lancement, double envoi, réponse et confirmation de suppression.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
