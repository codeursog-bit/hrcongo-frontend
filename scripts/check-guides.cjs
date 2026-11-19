const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(file, stubs = {}) {
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
  )((p) => (p in stubs ? stubs[p] : require(p)), m, m.exports);
  return m.exports;
}
const catalog = load("lib/guides/catalog.ts"),
  position = load("lib/guides/position.ts");
const {
  GUIDES,
  guideEntry,
  nextGuideStep,
  remainingGuideSteps,
  routeMatches,
  searchGuides,
} = catalog;
const sources = [];
function collect(dir) {
  for (const f of fs.readdirSync(path.join(root, dir), {
    withFileTypes: true,
  })) {
    const relative = path.join(dir, f.name);
    if (f.isDirectory()) collect(relative);
    else if (/\.tsx$/.test(f.name))
      sources.push([
        relative,
        fs.readFileSync(path.join(root, relative), "utf8"),
      ]);
  }
}
collect("app");
collect("components");
const anchors = new Set();
for (const [file, source] of sources) {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      node.name.text === "data-guide" &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      anchors.add(node.initializer.text);
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const sidebar = fs.readFileSync(
  path.join(root, "components/layout/Sidebar.tsx"),
  "utf8",
);
for (const id of ["paie", "recrutement", "employes"]) {
  assert.ok(sidebar.includes(`id: '${id}'`));
  assert.ok(sidebar.includes("`menu-${item.id}`"));
  anchors.add("menu-" + id);
}
let leaves = 0;
for (const guide of GUIDES) {
  const visited = new Set();
  function walk(id, chain = []) {
    assert.ok(!chain.includes(id), "cycle");
    const s = guide.steps.find((s) => s.id === id);
    assert.ok(s, id);
    visited.add(id);
    for (const selector of [s.target, s.prerequisite].filter(Boolean))
      for (const match of selector.matchAll(/data-guide="([^"]+)"/g))
        assert.ok(
          anchors.has(match[1]),
          `${guide.id}/${id}: missing ${match[1]}`,
        );
    if (s.choices) {
      for (const [anchor, next] of Object.entries(s.choices)) {
        assert.ok(anchors.has(anchor));
        assert.equal(nextGuideStep(s, anchor), next);
        walk(next, [...chain, id]);
      }
      assert.equal(nextGuideStep(s, "unknown"), undefined);
    } else if (s.next) walk(nextGuideStep(s), [...chain, id]);
    else {
      assert.equal(s.waitFor, "continue");
      leaves++;
    }
  }
  walk(guide.steps[0].id);
  assert.equal(visited.size, guide.steps.length);
  assert.equal(
    remainingGuideSteps(guide, "menu"),
    guide.id === "payroll-create" ? 3 : 4,
  );
  assert.equal(guideEntry(guide, "/dashboard"), "menu");
}
assert.equal(leaves, 7);
assert.equal(searchGuides("Employe", "ADMIN")[0].id, "employee-create");
assert.equal(searchGuides("", "EMPLOYEE").length, 0);
assert.equal(searchGuides("", "MANAGER").length, 0);
assert.equal(searchGuides("", "CABINET_ADMIN").length, 0);
assert.equal(guideEntry(GUIDES[0], "/paie/nouveau"), "individual");
assert.equal(guideEntry(GUIDES[2], "/pme/test/employes/import"), "import");
assert.ok(routeMatches(GUIDES[0].steps[2], "/pme/test/paie/nouveau"));
assert.ok(!routeMatches(GUIDES[0].steps[2], "/paie"));
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1440, 900],
])
  for (const rect of [
    null,
    { left: 0, top: 0, width: 50, height: 40 },
    { left: width - 50, top: height - 50, width: 50, height: 40 },
  ])
    for (const h of [220, 700]) {
      const p = position.guideBubblePosition(rect, width, height, h);
      assert.ok(p.left >= 16 && p.left + p.width <= width - 16);
      assert.ok(p.top >= 16 && p.top + Math.min(p.maxHeight, h) <= height - 16);
    }
// Hooks + DOM harness executes the actual overlay, without a browser or network.
const React = require("react");
let slots = [],
  hook = 0,
  effects = [],
  dirty = false,
  tree,
  props,
  portalHost;
const dom = new Map(),
  listeners = new Map(),
  observers = new Set(),
  frames = new Map();
let rafId = 0,
  dialogs = [];
class ElementMock {
  constructor(anchor, rect = { left: 100, top: 100, width: 200, height: 44 }) {
    this.dataset = { guide: anchor };
    this.rect = rect;
    this.parent = null;
    this.isConnected = true;
  }
  getBoundingClientRect() {
    return this.rect;
  }
  closest(s) {
    if (s === "[data-guide]")
      return this.dataset.guide ? this : this.parent?.closest(s);
    return null;
  }
  contains(el) {
    return el === this || el.parent === this;
  }
  scrollIntoView() {
    this.scrolled = true;
  }
  focus() {
    this.focused = true;
  }
  matches() {
    return true;
  }
  querySelectorAll(s) {
    return dom.get(s) || [];
  }
}
global.Element = ElementMock;
const body = new ElementMock("body"),
  dialog = new ElementMock("dialog");
global.document = {
  body,
  querySelectorAll: (s) => (s === "dialog[open]" ? dialogs : dom.get(s) || []),
  addEventListener: (k, fn) => {
    if (!listeners.has(k)) listeners.set(k, new Set());
    listeners.get(k).add(fn);
  },
  removeEventListener: (k, fn) => listeners.get(k)?.delete(fn),
};
global.window = {
  innerWidth: 390,
  innerHeight: 844,
  addEventListener() {},
  removeEventListener() {},
};
global.getComputedStyle = () => ({ display: "block", visibility: "visible" });
global.requestAnimationFrame = (fn) => {
  frames.set(++rafId, fn);
  return rafId;
};
global.cancelAnimationFrame = (id) => frames.delete(id);
global.MutationObserver = class {
  constructor(fn) {
    this.fn = fn;
    observers.add(this);
  }
  observe() {}
  disconnect() {
    observers.delete(this);
  }
};
global.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
function effect(fn, deps) {
  const i = hook++,
    old = slots[i];
  if (!old || deps.some((v, n) => !Object.is(v, old.deps[n])))
    effects.push(() => {
      old?.cleanup?.();
      slots[i] = { deps, cleanup: fn() };
    });
}
const hooks = {
  ...React,
  useState(initial) {
    const i = hook++;
    if (!(i in slots)) slots[i] = { value: initial };
    return [
      slots[i].value,
      (next) => {
        const value = typeof next === "function" ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) {
          slots[i].value = value;
          dirty = true;
        }
      },
    ];
  },
  useRef(value) {
    const i = hook++;
    if (!(i in slots)) slots[i] = { current: value };
    return slots[i];
  },
  useCallback(fn, deps) {
    const i = hook++,
      old = slots[i];
    if (!old || deps.some((v, n) => !Object.is(v, old.deps[n])))
      slots[i] = { deps, fn };
    return slots[i].fn;
  },
  useEffect: effect,
  useLayoutEffect: effect,
};
const { GuideOverlay } = load("components/guides/GuideOverlay.tsx", {
  react: hooks,
  "react-dom": {
    createPortal: (node, host) => {
      portalHost = host;
      return node;
    },
  },
  "@/lib/guides/catalog": catalog,
  "@/lib/guides/position": position,
});
function attach(node) {
  if (!node || typeof node !== "object") return;
  if (node.ref && typeof node.ref === "object")
    node.ref.current = new ElementMock("bubble", {
      left: 0,
      top: 0,
      width: 358,
      height: 280,
    });
  const c = node.props?.children;
  (Array.isArray(c) ? c : [c]).forEach(attach);
}
let Component = GuideOverlay;
function render() {
  for (let attempts = 0; attempts < 12; attempts++) {
    dirty = false;
    hook = 0;
    effects = [];
    tree = Component(props);
    attach(tree);
    const work = effects;
    effects = [];
    work.forEach((f) => f());
    if (!dirty) return;
  }
  throw Error("render loop");
}
function reset(next) {
  slots.forEach((s) => s?.cleanup?.());
  slots = [];
  listeners.clear();
  frames.clear();
  observers.clear();
  dom.clear();
  dialogs = [];
  props = next;
}
function mutation() {
  [...observers].forEach((o) => o.fn());
  const work = [...frames.values()];
  frames.clear();
  work.forEach((fn) => fn());
  render();
}
const advances = [];
let closes = 0;
const common = {
  guide: GUIDES[0],
  step: GUIDES[0].steps[1],
  path: "/paie",
  index: 1,
  allowed: true,
  advance: (id) => advances.push(id),
  close: () => closes++,
  navigate() {},
};
async function click(el) {
  for (const fn of listeners.get("click") || []) fn({ target: el });
  await Promise.resolve();
}
async function main() {
  reset(common);
  const modes = new ElementMock("paie-modes"),
    individual = new ElementMock("paie-individuelle");
  individual.parent = modes;
  dom.set(common.step.target, [modes]);
  render();
  assert.equal(portalHost, body);
  await click(new ElementMock("outside"));
  assert.equal(advances.length, 0);
  await click(individual);
  assert.deepEqual(advances, ["paie-individuelle"]);
  reset({ ...common, step: GUIDES[0].steps[2], path: "/paie", index: 2 });
  dom.set(GUIDES[0].steps[2].target, [individual]);
  render();
  await click(individual);
  assert.equal(advances.length, 1, "no advance on an unexpected route");
  props = { ...props, path: "/paie/nouveau" };
  render();
  assert.ok(individual.scrolled);
  reset({
    ...common,
    guide: GUIDES[1],
    step: GUIDES[1].steps[2],
    path: "/recrutement",
    index: 2,
  });
  const opener = new ElementMock("recrutement-create");
  dom.set(props.step.prerequisite, [opener]);
  render();
  await click(opener);
  assert.equal(
    advances.length,
    1,
    "opening a prerequisite does not skip a step",
  );
  const recModes = new ElementMock("recrutement-modes"),
    manual = new ElementMock("recrutement-manuel");
  manual.parent = recModes;
  dom.set(props.step.target, [recModes]);
  dialogs = [dialog];
  mutation();
  assert.equal(
    portalHost,
    dialog,
    "overlay must live in the native dialog top layer",
  );
  await click(manual);
  assert.equal(advances.at(-1), "recrutement-manuel");
  reset({ ...common, step: GUIDES[0].steps[0], path: "/dashboard", index: 0 });
  const mobile = new ElementMock("navigation-open");
  dom.set('[data-guide="navigation-open"]', [mobile]);
  render();
  const n = advances.length;
  await click(mobile);
  assert.equal(advances.length, n);
  const menu = new ElementMock("menu-paie");
  dom.set(props.step.target, [menu]);
  mutation();
  await click(menu);
  assert.equal(advances.length, n + 1);
  for (const fn of listeners.get("keydown") || [])
    fn({ key: "Escape", preventDefault() {}, stopPropagation() {} });
  assert.equal(closes, 1);
  slots.forEach((s) => s?.cleanup?.());
  assert.equal(
    [...listeners.values()].reduce((n, set) => n + set.size, 0),
    0,
    "all listeners must be removed",
  );
  assert.equal(observers.size, 0);
  // Provider: identity changes terminate the guide; unknown IDs/roles/features cannot start it.
  const windowEvents = new Map();
  window.addEventListener = (key, fn) => {
    if (!windowEvents.has(key)) windowEvents.set(key, new Set());
    windowEvents.get(key).add(fn);
  };
  window.removeEventListener = (key, fn) => windowEvents.get(key)?.delete(fn);
  let actor = { id: "user-a", companyId: "company-a", role: "ADMIN" },
    currentPath = "/dashboard",
    features = true;
  document.querySelector = () => null;
  document.activeElement = new ElementMock("launcher");
  const subscription = {
    hasFeature: () => features,
    isLoading: false,
    error: null,
  };
  const { GuideProvider } = load("components/guides/GuideProvider.tsx", {
    react: hooks,
    "next/navigation": {
      usePathname: () => currentPath,
      useRouter: () => ({ push() {} }),
    },
    "@/lib/services/authService": {
      authService: { getCurrentUser: () => actor },
    },
    "@/hooks/useSubscription": { useSubscription: () => subscription },
    "@/lib/guides/catalog": catalog,
    "./GuideOverlay": { GuideOverlay: "overlay" },
    "./guides.css": {},
  });
  Component = GuideProvider({ children: null }).type;
  reset({ children: null });
  render();
  assert.equal(tree.props.value.role, "ADMIN");
  tree.props.value.start("unknown");
  render();
  assert.equal(tree.props.value.active, false);
  features = false;
  tree.props.value.start("payroll-create");
  render();
  assert.equal(tree.props.value.active, false);
  features = true;
  tree.props.value.start("payroll-create");
  render();
  assert.equal(tree.props.value.active, true);
  const activeOverlay=()=>tree.props.children.find(node=>node?.type==='overlay');
  const advanceTwice=activeOverlay().props.advance;advanceTwice();advanceTwice();render();assert.equal(activeOverlay().props.index,1,'double clicks must not skip or duplicate a step');
  actor = { ...actor, companyId: "company-b" };
  for (const fn of windowEvents.get("focus")) fn();
  render();
  assert.equal(
    tree.props.value.active,
    false,
    "company switch must stop the previous guide",
  );
  props={...props,policy:{enabled:true,disabledGuides:[]}};render();tree.props.value.start('employee-create');render();assert.equal(tree.props.value.active,true);props={...props,policy:{enabled:false,disabledGuides:[]}};render();assert.equal(tree.props.value.active,false,'server guide switch must stop an active guide');props={...props,policy:{enabled:true,disabledGuides:['employee-create']}};render();tree.props.value.start('employee-create');render();assert.equal(tree.props.value.active,false,'disabled guide must not start');
  actor = { ...actor, role: "EMPLOYEE" };
  for (const fn of windowEvents.get("focus")) fn();
  render();
  tree.props.value.start("employee-create");
  render();
  assert.equal(tree.props.value.active, false);
  slots.forEach((s) => s?.cleanup?.());
  currentPath = "/pme/company-b/dashboard";
  assert.equal(
    GuideProvider({ children: null }).type,
    React.Fragment,
    "PME routes differ and are deferred for this guide lot",
  );
  assert.deepEqual(
    position.clipGuideRect(
      { left: 380, top: 830, width: 100, height: 200 },
      390,
      844,
    ),
    { left: 375, top: 825, width: 11, height: 15 },
  );
  const css = fs.readFileSync(
    path.join(root, "components/guides/guides.css"),
    "utf8",
  );
  require("postcss").parse(css);
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes("@media print"));
  for (const file of ["GuideProvider", "GuideOverlay", "GuideLauncher"]) {
    const source = fs.readFileSync(
      path.join(root, `components/guides/${file}.tsx`),
      "utf8",
    );
    assert.ok(
      !/\.click\(|dispatchEvent|fetch\(|api\.(post|put|patch|delete)/.test(
        source,
      ),
      "guide must not act or write",
    );
  }
  console.log(
    `PASS: ${GUIDES.length} guides, ${leaves} branches, cibles JSX, rôles, recherche, positions mobile/bureau, navigation, menu mobile, fenêtre native, Échap et nettoyage DOM.`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
