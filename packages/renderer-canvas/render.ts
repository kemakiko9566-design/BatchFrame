import type { RenderGraph } from '../core/layout';
export function render(graph: RenderGraph, image: CanvasImageSource, canvas: OffscreenCanvas | HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  for (const node of graph.nodes) {
    if (node.type === 'rect') { ctx.fillStyle = node.color; ctx.fillRect(node.x ?? 0, node.y ?? 0, node.width ?? graph.width, node.height ?? graph.height); }
    else ctx.drawImage(image, node.x, node.y, node.width, node.height);
  }
}
