// Run from the workspace root: node frontend/scripts/check-document-shapes.cjs
process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '../..');
const front = Module.createRequire(path.join(root, 'frontend/package.json'));
const back = Module.createRequire(path.join(root, 'backend/package.json'));
const ts = front('typescript');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(name, ...rest) { return originalResolve.call(this, name.startsWith('@/') ? path.join(root, 'frontend', name.slice(2)) : name, ...rest); };
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, experimentalDecorators: true } }).outputText, file);
require.extensions['.css'] = m => { m.exports = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) }); };
back('reflect-metadata');
const { validateLayoutBody } = require(path.join(root, 'backend/src/document-layouts/layout-validation.ts'));
const { makeInvoiceDesign, invoiceDesigns, invoiceExample } = front('./lib/document-engine/invoices.ts');
const { createPayslipLayout } = front('./lib/document-engine/registry.ts');
const { makeAdministrativeDesign, administrativeTypes } = front('./lib/document-engine/administrative.ts');
const { documentHistory, initialHistory } = front('./lib/document-engine/editor-state.ts');
const { payslipExample } = front('./lib/document-engine/example.ts');
const React = front('react');
const { renderToStaticMarkup } = front('react-dom/server');
const Renderer = front('./components/DocumentRenderer/index.tsx').default;
const clone = value => JSON.parse(JSON.stringify(value));
const shape = { id: 'test-line', anchor: 'cumuls', x: 10, y: 65, width: 15, thickness: .75, color: '#123456', style: 'dashed' };
const payroll = createPayslipLayout();
payroll.shapes = [shape];
validateLayoutBody({ config: clone(payroll) });
const html = renderToStaticMarkup(React.createElement(Renderer, { docType: 'PAYSLIP', layout: payroll, data: payslipExample }));
assert.match(html, /data-shape="test-line"/);
assert.match(html, /left:10%;top:65%;width:15%/);
assert.match(html, /0.75pt dashed #123456/);
assert.doesNotMatch(html, /Déplacer le séparateur libre/);
for (const mutate of [ s => s.width = 101, s => s.x = 95, s => s.anchor = 'missing', s => s.color = 'red', s => s.thickness = 20 ]) {
  const invalid = clone(payroll); mutate(invalid.shapes[0]);
  assert.throws(() => validateLayoutBody({ config: invalid }), { status: 400 });
}
for (const type of administrativeTypes) {
  const layout = makeAdministrativeDesign(type);
  layout.shapes = [{ ...shape, anchor: layout.blocks.at(-1).id }];
  validateLayoutBody({ config: clone(layout) }, type);
}
for (const id of [...invoiceDesigns.map(model => model.id), 'BLANK']) {
  for (const original of [false, true]) {
    const layout = makeInvoiceDesign(id, original);
    layout.shapes = [{ ...shape, anchor: 'services' }];
    const checked = validateLayoutBody({ config: clone(layout) }, 'CONTRACTOR_INVOICE');
    assert.equal(checked.basePreset, id);
    const markup = renderToStaticMarkup(React.createElement(Renderer, { docType: 'CONTRACTOR_INVOICE', layout, data: invoiceExample() }));
    assert.match(markup, /data-bulletin-root="true"/);
    assert.match(markup, /data-shape="test-line"/);
    assert.match(markup, /Net à payer/);
    assert.doesNotMatch(markup, /Direction des ressources humaines/);
  }
}
const invalidInvoice = makeInvoiceDesign();
invalidInvoice.blocks = invalidInvoice.blocks.filter(block => block.id !== 'totals');
assert.throws(() => validateLayoutBody({ config: clone(invalidInvoice) }, 'CONTRACTOR_INVOICE'), { status: 400 });
const history = initialHistory({ name: 'Original', layout: createPayslipLayout() });
const changed = documentHistory(history, { type: 'layout', patch: { shapes: [shape] } });
assert.deepEqual(changed.current.layout.blocks, history.current.layout.blocks);
assert.deepEqual(documentHistory(changed, { type: 'undo' }).current, history.current);
assert.deepEqual(documentHistory(documentHistory(changed, { type: 'undo' }), { type: 'redo' }).current, changed.current);
console.log('OK: séparateurs sans déplacement des blocs, rendu et validation des zones, annuler/rétablir, 5 demandes, 3 factures et page blanche, montants obligatoires.');

const { buildPayslipContext } = front('./lib/document-engine/payslip.ts');
const { bulletinGalleryExample } = front('./lib/document-engine/gallery-example.ts');
const leaveItems = [['LEAVE_DROITS', 30], ['LEAVE_PRIS', 12.5], ['LEAVE_SOLDE', 17.5]].map(([code, amount]) => ({ id: code, code, label: code, type: 'INFO', amount, order: 99 }));
const leaveData = buildPayslipContext({ ...bulletinGalleryExample, items: [...bulletinGalleryExample.items, ...leaveItems], ytd: { droitsConge: 999, priseConge: 999, soldeConge: 999 } });
assert.equal(leaveData.values['leave.entitled'], '30');
assert.equal(leaveData.values['leave.taken'], '12,5');
assert.equal(leaveData.values['leave.remaining'], '17,5');
assert.ok(!leaveData.items.some(row => row.key.startsWith('LEAVE_')));
const emptyLeave = buildPayslipContext({ ...bulletinGalleryExample, items: [] });
assert.equal(emptyLeave.values['leave.remaining'], '—');
const zeroLeave = buildPayslipContext({ ...bulletinGalleryExample, items: [{ ...leaveItems[2], amount: 0 }] });
assert.equal(zeroLeave.values['leave.remaining'], '0');
const leaveLayout = createPayslipLayout();
assert.ok(!leaveLayout.blocks.some(block => block.type === 'leaveBalance'));
leaveLayout.blocks.push({ id: 'leave-balance', type: 'leaveBalance', row: 10, col: 1, span: 12, visible: true, config: {} });
validateLayoutBody({ config: clone(leaveLayout) });
const renderLeave = () => renderToStaticMarkup(React.createElement(Renderer, { docType: 'PAYSLIP', layout: leaveLayout, data: leaveData }));
assert.match(renderLeave(), /Congés restants/);
assert.match(renderLeave(), /17,5/);
leaveLayout.blocks.at(-1).visible = false;
assert.doesNotMatch(renderLeave(), /Congés restants/);
console.log('OK: congés optionnels, snapshots prioritaires, décimales, zéro, données absentes et masquage.');
