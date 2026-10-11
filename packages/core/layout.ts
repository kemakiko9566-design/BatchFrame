// Shared, pure geometry for previews and full-resolution output.
export type PaperId = 'mini' | 'square' | 'wide';
export type FrameStyle = 'border' | 'paper' | 'reference';
export interface PaperSpec { id: PaperId; name: string; width: number; height: number; imageWidth: number; imageHeight: number; top: number }
export const papers: PaperSpec[] = [
  { id: 'mini', name: 'Mini', width: 54, height: 86, imageWidth: 46, imageHeight: 62, top: 5 },
  { id: 'square', name: 'Square', width: 72, height: 86, imageWidth: 62, imageHeight: 62, top: 5 },
  { id: 'wide', name: 'Wide', width: 108, height: 86, imageWidth: 99, imageHeight: 62, top: 5 },
];
export interface ImageDocument {
  width: number; height: number; border: number; ratio?: [number, number];
  style?: FrameStyle; paper?: PaperId; background?: string; outputWidth?: number;
}
export interface Box { x: number; y: number; width: number; height: number }
export interface RenderGraph {
  width: number; height: number; paperBox?: Box; apertureBox?: Box;
  nodes: ({ type: 'rect'; color: string; x?: number; y?: number; width?: number; height?: number } | ({ type: 'image' } & Box))[];
}
export function layout(doc: ImageDocument): RenderGraph {
  if (![doc.width, doc.height].every(v => Number.isInteger(v) && v > 0)) throw new Error('Invalid image dimensions');
  if (!Number.isFinite(doc.border) || doc.border < 0 || doc.border > .25) throw new Error('Invalid border ratio');
  if (doc.background && !/^#[\da-f]{6}$/i.test(doc.background)) throw new Error('Invalid background color');
  const ratio = doc.ratio ?? [doc.width, doc.height];
  if (doc.ratio && !ratio.every(v => Number.isInteger(v) && v >= 1 && v <= 100)) throw new Error('Invalid canvas ratio');
  const target = doc.outputWidth ?? 1080;
  if (!Number.isInteger(target) || target < 64 || target > 4096) throw new Error('Invalid output width');
  const unit = Math.max(1, Math.round(target / ratio[0]));
  const width = doc.ratio ? ratio[0] * unit : doc.width;
  const height = doc.ratio ? ratio[1] * unit : doc.height;
  if (width * height > 40_000_000 || Math.max(width, height) > 16384) throw new Error('Canvas ratio exceeds supported dimensions');
  const nodes: RenderGraph['nodes'] = [{ type: 'rect', color: doc.background ?? '#ffffff' }];
  let area: Box;
  let paperBox: Box | undefined;
  let apertureBox: Box | undefined;
  if (doc.style === 'paper') {
    const spec = papers.find(p => p.id === (doc.paper ?? 'mini'));
    if (!spec) throw new Error('Unknown paper format');
    // Official overall/aperture dimensions; aperture offset is an approximation.
    const scale = Math.min(width * .82 / spec.width, height * .9 / spec.height);
    paperBox = { x: (width - spec.width * scale) / 2, y: (height - spec.height * scale) / 2, width: spec.width * scale, height: spec.height * scale };
    nodes.push({ type: 'rect', color: '#faf9f6', ...paperBox });
    area = { x: paperBox.x + (spec.width - spec.imageWidth) * scale / 2, y: paperBox.y + spec.top * scale, width: spec.imageWidth * scale, height: spec.imageHeight * scale };
    apertureBox = area;
    nodes.push({ type: 'rect', color: '#ffffff', ...area });
  } else if (doc.style === 'reference') {
    // Smart Museum object 1980.79: sheet 99x130mm, image 94x121mm.
    // Centered placement is inferred from dimensions, not a measured edge offset.
    const scale = Math.min(width * .94 / 99, height * .94 / 130);
    const sheet = { x: (width - 99 * scale) / 2, y: (height - 130 * scale) / 2, width: 99 * scale, height: 130 * scale };
    nodes.push({ type: 'rect', color: '#ffffff', ...sheet });
    area = { x: sheet.x + 2.5 * scale, y: sheet.y + 4.5 * scale, width: 94 * scale, height: 121 * scale };
    apertureBox = area;
  } else {
    const margins = [doc.border, doc.border, doc.border, doc.border];
    if (!margins.every(v => Number.isFinite(v) && v >= 0 && v <= .25)) throw new Error('Invalid frame margins');
    const [top, right, bottom, left] = margins.map(v => v * Math.min(width, height));
    area = { x: left, y: top, width: width - left - right, height: height - top - bottom };
  }
  const scale = Math.min(area.width / doc.width, area.height / doc.height);
  const iw = doc.width * scale, ih = doc.height * scale;
  nodes.push({ type: 'image', x: area.x + (area.width - iw) / 2, y: area.y + (area.height - ih) / 2, width: iw, height: ih });
  return { width, height, nodes, paperBox, apertureBox };
}
