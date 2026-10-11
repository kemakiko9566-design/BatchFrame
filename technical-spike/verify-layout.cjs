// Checks shared geometry without opening or automating a browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../packages/core/layout.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const box = { exports: {} }; vm.runInNewContext(js, box);
const { layout, papers } = box.exports;
const close = (a, b) => assert.ok(Math.abs(a - b) < .000001, `${a} != ${b}`);
const ratios = [[3, 4], [1, 1], [9, 16], [16, 9]];
let checks = 0;
for (const paper of papers) for (const ratio of ratios) for (const dimensions of [[600, 400], [400, 600], [900, 900]]) {
  const graph = layout({ width: dimensions[0], height: dimensions[1], ratio, border: .065, style: 'paper', paper: paper.id });
  close(graph.width / graph.height, ratio[0] / ratio[1]);
  close(graph.paperBox.width / graph.paperBox.height, paper.width / paper.height);
  close(graph.apertureBox.width / graph.apertureBox.height, paper.imageWidth / paper.imageHeight);
  const image = graph.nodes.find(n => n.type === 'image');
  close(image.width / image.height, dimensions[0] / dimensions[1]);
  for (const region of [graph.paperBox, graph.apertureBox, image]) {
    assert.ok(region.x >= 0 && region.y >= 0 && region.x + region.width <= graph.width + .000001 && region.y + region.height <= graph.height + .000001);
  }
  assert.ok(image.x >= graph.apertureBox.x - .000001 && image.y >= graph.apertureBox.y - .000001);
  assert.ok(image.x + image.width <= graph.apertureBox.x + graph.apertureBox.width + .000001);
  assert.ok(image.y + image.height <= graph.apertureBox.y + graph.apertureBox.height + .000001);
  const preview = layout({ width: dimensions[0], height: dimensions[1], ratio, border: .065, style: 'paper', paper: paper.id, outputWidth: 540 });
  const previewImage = preview.nodes.find(n => n.type === 'image');
  close(previewImage.x / preview.width, image.x / graph.width);
  close(previewImage.y / preview.height, image.y / graph.height);
  close(previewImage.width / preview.width, image.width / graph.width);
  checks++;
}
for (const border of [0, .035, .065, .1, .25]) {
  const graph = layout({ width: 600, height: 400, ratio: [3, 4], border, style: 'border', background: '#242628' });
  const image = graph.nodes.find(n => n.type === 'image');
  assert.ok(image.x >= border * 1080 - .000001);
  assert.ok(image.y >= border * 1080 - .000001);
  close(image.width / image.height, 1.5);
  assert.equal(graph.nodes[0].color, '#242628'); checks++;
}
const reference = layout({ width: 940, height: 1210, ratio: [3, 4], border: 0, style: 'reference' });
const referenceImage = reference.nodes.find(n => n.type === 'image');
close(referenceImage.width / referenceImage.height, 94 / 121);
const original = layout({ width: 600, height: 400, ratio: [3, 4], border: 0 });
assert.equal(original.width, 1080); assert.equal(original.height, 1440);
for (const patch of [{ ratio: [0, 4] }, { ratio: [1, 100] }, { border: -.01 }, { border: .5 }, { width: 0 }, { background: 'red' }, { paper: 'invalid', style: 'paper' }]) {
  assert.throws(() => layout({ width: 600, height: 400, ratio: [3, 4], border: 0, ...patch })); checks++;
}
console.log(`PASS: ${checks} geometry cases; official paper/aperture ratios, full-photo containment, preview/output consistency, background, border presets, reference geometry, allocation/invalid-input limits.`);
