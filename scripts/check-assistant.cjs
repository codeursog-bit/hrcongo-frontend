const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const root = path.resolve(__dirname, ".."),
  cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const m = { exports: {} },
    source = fs.readFileSync(path.join(root, relative + ".ts"), "utf8");
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }).outputText,
  )(
    (name) =>
      name.startsWith("@/")
        ? load(name.slice(2))
        : name === "./knowledge.json"
          ? require(path.join(root, "lib/assistant/knowledge.json"))
          : require(name),
    m,
    m.exports,
  );
  cache.set(relative, m.exports);
  return m.exports;
}
const { consumeAssistantStream } = load("lib/assistant/stream");
const { assistantDemo } = load("lib/data/assistant.demo");
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
};
global.crypto = require("node:crypto").webcrypto;
async function main() {
  const events = [
    { type: "meta", data: { conversationId: "c", messageId: "m" } },
    {
      type: "text",
      data: { text: "Équipe et rémunération : aide, aucun montant." },
    },
    {
      type: "done",
      data: {
        conversationId: "c",
        messageId: "m",
        payload: { source: "help:employees", refusal: false },
      },
    },
  ];
  const raw = events
    .map((e) => `event: ${e.type}\r\ndata: ${JSON.stringify(e.data)}\r\n\r\n`)
    .join("");
  const bytes = new TextEncoder().encode(raw);
  for (const stride of [1, 2, 7, 1500]) {
    const seen = [],
      body = new ReadableStream({
        start(controller) {
          for (let i = 0; i < bytes.length; i += stride)
            controller.enqueue(bytes.slice(i, i + stride));
          controller.close();
        },
      });
    await consumeAssistantStream(
      body,
      (e) => seen.push(e),
      new AbortController().signal,
    );
    assert.deepEqual(
      seen,
      events,
      "SSE/UTF-8 must be independent of chunk boundaries",
    );
  }
  await assert.rejects(
    () =>
      consumeAssistantStream(
        new ReadableStream({
          start(c) {
            c.enqueue(
              new TextEncoder().encode(
                'event: text\ndata: {"text":"interrompu"}\n\n',
              ),
            );
            c.close();
          },
        }),
        () => {},
        new AbortController().signal,
      ),
    /interrompue/,
  );
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(
    () =>
      consumeAssistantStream(
        new ReadableStream({
          start(c) {
            c.close();
          },
        }),
        () => {},
        abort.signal,
      ),
    { name: "AbortError" },
  );
  const a = { id: "a", companyId: "one", role: "ADMIN" },
    b = { ...a, id: "b" },
    other = { ...a, companyId: "two" };
  const demo = assistantDemo(a),
    captured = [];
  await demo.chat(
    { message: "Comment faire la paie ?", requestId: crypto.randomUUID() },
    (e) => captured.push(e),
    new AbortController().signal,
  );
  const done = captured.find((e) => e.type === "done").data;
  assert.ok(done.payload.guideId);
  assert.equal((await demo.get(done.conversationId)).messages.length, 2);
  assert.equal((await assistantDemo(b).list()).length, 0);
  assert.equal((await assistantDemo(other).list()).length, 0);
  await assert.rejects(
    () => assistantDemo(b).get(done.conversationId),
    /indisponible/,
  );
  await demo.feedback(done.messageId, 1);
  assert.equal((await demo.get(done.conversationId)).messages[1].rating, 1);
  await demo.remove(done.conversationId);
  assert.equal((await demo.list()).length, 0);
  const employee = assistantDemo({ ...a, role: "EMPLOYEE" });
  assert.ok(!(await employee.help()).some((h) => h.id === "employees"));
  const refused = [];
  await employee.chat(
    {
      message: "Quel est le net de Marie 500000 ?",
      requestId: crypto.randomUUID(),
    },
    (e) => refused.push(e),
    new AbortController().signal,
  );
  assert.ok(refused.some((e) => e.type === "refusal"));
  assert.ok(![...storage.values()].join("").includes("500000"));
  require("postcss").parse(
    fs.readFileSync(
      path.join(root, "components/assistant/assistant.css"),
      "utf8",
    ),
  );
  const css=fs.readFileSync(path.join(root,'components/assistant/assistant.css'),'utf8'),globals=fs.readFileSync(path.join(root,'app/globals.css'),'utf8');for(const match of css.matchAll(/var\((--[\w-]+)/g))assert.ok(globals.includes(match[1]+':'),'missing theme token '+match[1]);
  console.log(
    "PASS: SSE découpé octet par octet, UTF-8/CRLF, interruption, démo isolée/persistante, avis, suppression et refus des analyses.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
