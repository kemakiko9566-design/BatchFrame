import './ui.css';
import { layout, papers, type FrameStyle, type PaperId, type ImageDocument } from '../packages/core/layout';
import { renderPhoto, thumbnail } from './images';
import leftIcon from '@phosphor-icons/core/assets/regular/caret-left.svg?url';
import rightIcon from '@phosphor-icons/core/assets/regular/caret-right.svg?url';
import plusIcon from '@phosphor-icons/core/assets/regular/plus.svg?url';
import heartIcon from '@phosphor-icons/core/assets/regular/heart.svg?url';
import chatIcon from '@phosphor-icons/core/assets/regular/chat-circle.svg?url';
import dotsIcon from '@phosphor-icons/core/assets/regular/dots-three.svg?url';
import trashIcon from '@phosphor-icons/core/assets/regular/trash.svg?url';
import squareIcon from '@phosphor-icons/core/assets/regular/square.svg?url';
import rectIcon from '@phosphor-icons/core/assets/regular/rectangle.svg?url';
import customIcon from '@phosphor-icons/core/assets/regular/selection.svg?url';
import shareIcon from '@phosphor-icons/core/assets/regular/share-fat.svg?url';

const icon = (url: string, className = '') => `<img class="icon ${className}" src="${url}" alt="" aria-hidden="true">`;
export interface Photo { id: number; file: File; thumb: Blob; url: string; width: number; height: number }
export type Settings = Omit<ImageDocument, 'width' | 'height'>;
export interface Output { id: number; file: File; url: string; width: number; height: number }
const platforms = [
  { id: 'xhs', name: '小红书', scene: '图文笔记', ratio: [3, 4] as [number, number], color: '#ff2848' },
  { id: 'wechat', name: '朋友圈', scene: '日常照片', ratio: [1, 1] as [number, number], color: '#168b57' },
  { id: 'instagram', name: 'Instagram', scene: '动态照片', ratio: [4, 5] as [number, number], color: '#a65491' },
  { id: 'douyin', name: '抖音', scene: '图文分享', ratio: [9, 16] as [number, number], color: '#242629' },
  { id: 'custom', name: '自定义', scene: '自由设置画布', ratio: [3, 4] as [number, number], color: '#727c75' },
];
const demoPath = '/demo/coast-cafe.png';
const borders = [{ name: '无', value: 0 }, { name: '窄', value: .035 }, { name: '标准', value: .065 }, { name: '宽', value: .1 }];

export function createUI() {
  document.body.innerHTML = `<div class="app-shell">
    <header class="app-header"><button id="nav-back" class="icon-button" aria-label="返回上一步" hidden>${icon(leftIcon)}</button><span class="header-spacer" id="header-spacer"></span><strong>BatchFrame</strong><button id="add-header" class="text-button">添加</button></header>
    <main>
      <section id="step-platform" class="page intro-page"><p class="eyebrow">让照片，完整呈现</p><h1 tabindex="-1">选择发布平台</h1><p class="intro">准备适合发布场景的画布，照片始终在本机处理。</p><div id="platform-cards" class="platform-list"></div><p class="muted">比例是可编辑的产品建议，平台预览为布局示意。</p><button id="next-platform" class="primary">继续</button></section>
      <section id="step-ratio" class="page intro-page" hidden><p id="ratio-platform" class="eyebrow"></p><h1 tabindex="-1">选择画布比例</h1><p class="intro">相纸比例独立固定，外层画布决定发布尺寸。</p><div id="ratio-cards" class="ratio-grid"></div><button id="custom-ratio-start" class="secondary wide-button">自定义比例</button><p class="muted">后续仍可修改比例，已添加的照片会保留。</p><button id="next-ratio" class="primary">继续添加照片</button></section>
      <section id="step-import" class="page editor-page" hidden>
        <div class="editor-heading"><div><h1 tabindex="-1">预览与保存</h1><div class="platform-summary"><span>已选择平台：</span><span id="platform-label" class="platform-badge"></span><button id="change-platform" class="link-button">修改 ${icon(rightIcon)}</button></div></div><div class="segmented" aria-label="预览模式"><button data-view="photo" aria-pressed="false">照片</button><button data-view="platform" aria-pressed="true">平台示意</button></div></div>
        <div id="drop-zone" class="preview-stage">
          <div id="social-preview" class="social-preview" data-platform="xhs">
            <div class="post-user"><img class="avatar" src="${demoPath}" alt=""><span>昵称</span><span class="post-menu" aria-hidden="true">${icon(dotsIcon)}</span></div>
            <div class="preview-image-wrap"><img id="preview-image" alt="示例照片预览"><span id="preview-index" class="preview-index" hidden></span><div class="overlay-icons" aria-hidden="true">${icon(heartIcon)}${icon(chatIcon)}${icon(shareIcon)}</div><div class="overlay-caption" aria-hidden="true">@你的照片<br>分享这一刻</div></div>
            <div class="post-bottom" aria-hidden="true"><div id="post-dots" class="post-dots"></div><div class="post-icons">${icon(heartIcon)}${icon(chatIcon)}</div></div>
          </div>
        </div>
        <p id="preview-note" class="preview-note">平台布局示意 · 示例照片</p>
        <div class="gallery-heading"><span id="photo-count">添加你的照片</span><button id="remove-current" class="text-button small" hidden>${icon(trashIcon)} 移除</button></div>
        <div id="gallery" class="gallery"></div><p id="import-error" class="error" role="alert" hidden></p>
        <section class="inspector" aria-label="照片样式与画布设置">
          <div class="style-tabs" aria-label="边框风格"><button data-style="border" aria-pressed="false">白边</button><button data-style="paper" aria-pressed="true">相纸</button><button data-style="reference" aria-pressed="false">摄影师参考</button></div>
          <div id="paper-options" class="paper-options"></div>
          <div id="border-options" class="border-options" hidden></div>
          <div id="reference-options" class="reference-options" hidden><button id="reference-preset" class="reference-card" aria-pressed="true"><img id="reference-thumb" alt="印相尺寸参考"><span><strong>Walker Evans</strong><small>单件印相尺寸参考</small></span></button><p class="muted">参考馆藏尺寸，居中布局为推算；不是摄影师固定边框标准。</p></div>
          <button id="spec-details" class="link-button details-button">规格详情 ${icon(rightIcon)}</button>
          <div class="canvas-row"><span class="control-label">画布</span><div class="canvas-options"><button data-ratio="3:4" aria-pressed="true">${icon(rectIcon)} 3:4</button><button data-ratio="1:1" aria-pressed="false">${icon(squareIcon)} 1:1</button><button id="custom-ratio" aria-pressed="false">${icon(customIcon)}<span>自定义</span></button></div><button id="background-button" class="background-button"><span id="background-swatch"></span><span>背景色</span></button></div>
        </section>
        <div class="save-footer"><button id="run" class="primary" disabled>添加照片后保存或分享</button><p class="privacy">本地处理 · 保留原图</p></div>
      </section>
      <section id="result-page" class="page result-page" hidden><h1 tabindex="-1">图片已生成</h1><p id="result-summary"></p><p id="delivery-note" class="intro"></p><div id="result-gallery" class="result-gallery"></div><ul id="failures" class="error-list"></ul><button id="share-results" class="primary" hidden>保存或分享图片</button><p id="delivery-status" class="muted" role="status"></p><button id="return-editor" class="secondary wide-button">返回调整</button></section>
    </main>
    <input id="files" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>
    <div id="processing" class="processing" role="dialog" aria-modal="true" aria-label="正在生成照片" hidden><div><h2>正在生成照片</h2><progress id="progress" value="0" max="1"></progress><p id="status" role="status"></p><button id="cancel" class="secondary">取消处理</button></div></div>
    <dialog id="settings-dialog" class="sheet"><form id="dialog-form"><div class="sheet-header"><h2 id="dialog-title"></h2><button type="button" id="close-dialog" class="text-button">关闭</button></div><div id="dialog-content"></div><button id="dialog-submit" class="primary" type="submit">完成</button></form></dialog>
  </div>`;

  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const input = el<HTMLInputElement>('files');
  let step = 0, busy = false, importing = false, counter = 0, selected = 0, generation = 0;
  let platformId = 'xhs', style: FrameStyle = 'paper', paper: PaperId = 'mini', ratio: [number, number] = [3, 4];
  let border = .065, background = '#ffffff', view = 'platform', previewUrl = '';
  let photos: Photo[] = [], outputs: Output[] = [];
  let demo: Blob | undefined;
  let generateHandler: (() => void) | undefined;
  let cancelHandler: (() => void) | undefined;
  let invalidateHandler: (() => void) | undefined;
  let dialogAction: (() => boolean) | undefined;
  const theme = () => platforms.find(p => p.id === platformId)!;
  const getSettings = (outputWidth = 1080): Settings => ({ ratio: [...ratio], style, paper, border, background, outputWidth });
  function invalidate() { invalidateHandler?.(); }
  function showError(message: string) { const node = el('import-error'); node.textContent = message; node.hidden = !message; }

  function showStep(next: number) {
    step = next;
    ['step-platform', 'step-ratio', 'step-import', 'result-page'].forEach((id, i) => el(id).hidden = i !== next);
    el('nav-back').hidden = next === 0;
    el('header-spacer').hidden = next !== 0;
    el('add-header').hidden = next === 3;
    el('ratio-platform').textContent = `发布到 ${theme().name}`;
    const page = document.querySelector<HTMLElement>('.page:not([hidden])');
    page?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
  el('nav-back').onclick = () => { if (!busy && !importing) showStep(step === 3 ? 2 : Math.max(0, step - 1)); };
  el('next-platform').onclick = () => showStep(1);
  el('next-ratio').onclick = () => showStep(2);
  function addPhotos() { if (!busy && !importing) input.click(); }
  el('add-header').onclick = () => { if (step < 2) showStep(2); addPhotos(); };

  function syncSettings() {
    el('platform-label').textContent = theme().name;
    el('platform-label').style.setProperty('--platform-color', theme().color);
    el('social-preview').dataset.platform = platformId;
    el('social-preview').dataset.view = view;
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    document.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.style === style)));
    el('paper-options').hidden = style !== 'paper'; el('border-options').hidden = style !== 'border'; el('reference-options').hidden = style !== 'reference';
    el('spec-details').innerHTML = `${style === 'reference' ? '参考来源' : style === 'border' ? '留白说明' : '规格详情'} ${icon(rightIcon)}`;
    document.querySelectorAll<HTMLButtonElement>('[data-paper]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.paper === paper)));
    document.querySelectorAll<HTMLButtonElement>('[data-border]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.border) === border)));
    document.querySelectorAll<HTMLButtonElement>('[data-ratio]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ratio === ratio.join(':'))));
    const custom = el<HTMLButtonElement>('custom-ratio');
    custom.setAttribute('aria-pressed', String(!['3:4', '1:1'].includes(ratio.join(':'))));
    custom.querySelector('span')!.textContent = ['3:4', '1:1'].includes(ratio.join(':')) ? '自定义' : ratio.join(':');
    el('background-swatch').style.backgroundColor = background;
  }
  const platformCards = el('platform-cards');
  platforms.forEach(p => {
    const b = document.createElement('button'); b.className = 'platform-card'; b.dataset.platform = p.id;
    b.innerHTML = `<span class="platform-mark" style="background:${p.color}">${p.name === 'Instagram' ? 'IG' : p.name.slice(0, 1)}</span><span><strong>${p.name}</strong><small>${p.scene}</small></span>${icon(rightIcon)}`;
    b.setAttribute('aria-pressed', String(p.id === platformId));
    b.onclick = () => { platformId = p.id; ratio = [...p.ratio]; platformCards.querySelectorAll<HTMLButtonElement>('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); syncSettings(); invalidate(); void updatePreview(); };
    platformCards.append(b);
  });
  for (const value of ['3:4', '1:1', '4:5', '9:16', '4:3', '16:9']) {
    const b = document.createElement('button'); b.className = 'ratio-card'; b.dataset.ratio = value;
    b.innerHTML = `${icon(value === '1:1' ? squareIcon : rectIcon)}<strong>${value}</strong>`;
    b.onclick = () => { ratio = value.split(':').map(Number) as [number, number]; syncSettings(); invalidate(); void updatePreview(); };
    el('ratio-cards').append(b);
  }
  document.querySelectorAll<HTMLButtonElement>('.canvas-options [data-ratio]').forEach(b => b.onclick = () => { ratio = b.dataset.ratio!.split(':').map(Number) as [number, number]; syncSettings(); invalidate(); void updatePreview(); });
  document.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(b => b.onclick = () => { style = b.dataset.style as FrameStyle; syncSettings(); invalidate(); void updatePreview(); });
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view!; syncSettings(); updateNote(); });

  for (const p of papers) {
    const b = document.createElement('button'); b.className = 'paper-card'; b.dataset.paper = p.id;
    b.innerHTML = `<img id="paper-thumb-${p.id}" class="paper-miniature" alt="${p.name} 相纸比例"><strong>${p.name}</strong><small>${p.width} × ${p.height} mm</small>`;
    b.onclick = () => { paper = p.id; syncSettings(); invalidate(); void updatePreview(); }; el('paper-options').append(b);
  }
  for (const preset of borders) {
    const b = document.createElement('button'); b.className = 'border-card'; b.dataset.border = String(preset.value);
    b.innerHTML = `<img id="border-thumb-${preset.name}" alt="${preset.name}留白效果"><span>${preset.name}</span>`;
    b.onclick = () => { border = preset.value; syncSettings(); invalidate(); void updatePreview(); }; el('border-options').append(b);
  }
  const customBorder = document.createElement('button'); customBorder.className = 'link-button custom-border'; customBorder.textContent = '自定义';
  customBorder.onclick = () => {
    const previous = border;
    openDialog('调整留白', `<p class="muted">点击增减，主预览同步更新。</p><div class="border-adjust"><button type="button" id="less-border" class="secondary">更窄</button><span id="border-size-label"></span><button type="button" id="more-border" class="secondary">更宽</button></div><button type="button" id="reset-border" class="link-button">恢复进入前设置</button>`, () => true);
    const sync = () => { el('border-size-label').textContent = border === 0 ? '无额外留白' : '自定义留白'; syncSettings(); invalidate(); void updatePreview(); };
    el('less-border').onclick = () => { border = Math.max(0, Number((border - .01).toFixed(3))); sync(); };
    el('more-border').onclick = () => { border = Math.min(.25, Number((border + .01).toFixed(3))); sync(); };
    el('reset-border').onclick = () => { border = previous; sync(); }; sync();
  }; el('border-options').append(customBorder);

  const dialog = el<HTMLDialogElement>('settings-dialog');
  function openDialog(title: string, content: string, action?: () => boolean) {
    el('dialog-title').textContent = title; el('dialog-content').innerHTML = content;
    el('dialog-submit').hidden = !action; dialogAction = action;
    dialog.showModal();
  }
  el('close-dialog').onclick = () => dialog.close();
  el<HTMLFormElement>('dialog-form').onsubmit = event => { event.preventDefault(); if (!dialogAction || dialogAction()) dialog.close(); };
  dialog.onclick = event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientY < r.top || event.clientY > r.bottom || event.clientX < r.left || event.clientX > r.right) dialog.close(); } };
  function customRatio() {
    openDialog('自定义画布', `<p class="muted">宽、高各为 1–100 的整数；过大的输出尺寸会被提示。</p><div class="ratio-inputs"><label>宽<input id="ratio-width" type="number" min="1" max="100" step="1" value="${ratio[0]}" required></label><span>:</span><label>高<input id="ratio-height" type="number" min="1" max="100" step="1" value="${ratio[1]}" required></label></div><p id="ratio-error" class="error" role="alert"></p>`, () => {
      const next: [number, number] = [Number(el<HTMLInputElement>('ratio-width').value), Number(el<HTMLInputElement>('ratio-height').value)];
      try { layout({ width: 800, height: 600, ...getSettings(), ratio: next }); ratio = next; syncSettings(); invalidate(); void updatePreview(); return true; }
      catch { el('ratio-error').textContent = '该比例无效或输出过大，请调整宽高。'; return false; }
    });
  }
  el('custom-ratio').onclick = customRatio; el('custom-ratio-start').onclick = customRatio;
  el('background-button').onclick = () => {
    openDialog('画布背景色', `<p class="muted">仅改变相纸外面的画布，相纸保持本身的颜色。</p><div class="color-options">${['#ffffff', '#f3f1ed', '#e6e8eb', '#242628'].map(color => `<button type="button" data-color="${color}" aria-label="背景 ${color}" aria-pressed="${color === background}" style="background:${color}"></button>`).join('')}</div><label class="color-custom">自定义颜色<input id="color-input" type="color" value="${background}"></label>`, () => true);
    const change = (color: string) => { background = color; syncSettings(); invalidate(); void updatePreview(); document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === color))); };
    document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(b => b.onclick = () => { change(b.dataset.color!); el<HTMLInputElement>('color-input').value = background; });
    el<HTMLInputElement>('color-input').oninput = e => change((e.target as HTMLInputElement).value);
  };
  el('change-platform').onclick = () => {
    openDialog('修改发布平台', `<div class="platform-dialog">${platforms.map(p => `<button type="button" data-choice="${p.id}" aria-pressed="${p.id === platformId}">${p.name}</button>`).join('')}</div><p class="muted">仅改变平台模拟，保留你已选择的画布比例。</p>`, () => true);
    document.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(b => b.onclick = () => { platformId = b.dataset.choice!; syncSettings(); document.querySelectorAll('[data-choice]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); invalidate(); });
  };
  el('spec-details').onclick = () => {
    if (style === 'paper') {
      const p = papers.find(p => p.id === paper)!;
      openDialog(`instax ${p.name} 规格`, `<p>相纸：${p.width} × ${p.height} mm</p><p>成像区：${p.imageWidth} × ${p.imageHeight} mm</p><p class="muted">外形与成像区按官方尺寸等比模拟。成像区上下位置为近似，屏幕显示不是实物等大。照片完整适配成像区，不自动裁切。</p><a href="https://www.fujifilm.com/us/en/consumer/instax/film" target="_blank" rel="noopener noreferrer">查看富士官方规格</a>`);
    } else if (style === 'reference') {
      openDialog('Walker Evans · 单件印相参考', `<p>参考作品：Untitled (Portrait of man, with display case)，馆藏编号 1980.79。</p><p>纸张 99 × 130 mm，图像 94 × 121 mm。按两者尺寸推算居中留边，原图完整适配；并非原作四边精确测量或摄影师统一标准。</p><p class="muted">来源：芝加哥大学 Smart Museum。单件样本，1980 年印制。</p><a href="https://smartcollection.uchicago.edu/objects/4644/untitled-portrait-of-man-with-display-case" target="_blank" rel="noopener noreferrer">查看馆藏来源</a>`);
    } else openDialog('留白说明', '<p>「无」表示不增加额外留白。为完整保留照片、匹配画布比例所需的补白仍会保留。</p><p class="muted">所有照片共用所选档位，主预览与正式输出采用相同规则。</p>');
  };

  function updateAvailability() {
    const run = el<HTMLButtonElement>('run'); run.disabled = busy || importing || !photos.length;
    run.textContent = busy ? '正在生成…' : importing ? '正在读取照片…' : photos.length ? `保存或分享 ${photos.length} 张照片` : '添加照片后保存或分享';
    el('photo-count').textContent = importing ? '正在读取照片…' : photos.length ? `已导入 ${photos.length} 张照片` : '添加你的照片';
    el('remove-current').hidden = !photos.length;
  }
  function refreshGallery() {
    const gallery = el('gallery'); gallery.replaceChildren();
    if (!photos.length) {
      const button = document.createElement('button'); button.className = 'demo-thumb'; button.innerHTML = `<img src="${demoPath}" alt="示例照片"><span>试用示例</span>`; button.onclick = () => void importDemo(); gallery.append(button);
    }
    photos.forEach((photo, index) => {
      const b = document.createElement('button'); b.className = 'thumb'; b.setAttribute('aria-label', `预览第 ${index + 1} 张：${photo.file.name}`); b.setAttribute('aria-pressed', String(selected === photo.id));
      const img = document.createElement('img'); img.src = photo.url; img.alt = photo.file.name; b.append(img);
      b.onclick = () => { selected = photo.id; refreshGallery(); void updatePreview(); }; gallery.append(b);
    });
    const add = document.createElement('button'); add.className = 'add-tile'; add.setAttribute('aria-label', '添加照片'); add.innerHTML = icon(plusIcon); add.onclick = addPhotos; gallery.append(add);
    const dots = el('post-dots'); dots.replaceChildren();
    const count = Math.min(photos.length || 4, 6); for (let i = 0; i < count; i++) { const dot = document.createElement('span'); dot.className = i === Math.min(photos.findIndex(p => p.id === selected), count - 1) || (!photos.length && i === 0) ? 'active' : ''; dots.append(dot); }
    const current = photos.findIndex(p => p.id === selected);
    el('preview-index').textContent = `${current + 1}/${photos.length}`; el('preview-index').hidden = photos.length < 2;
    updateAvailability();
  }
  async function addFiles(files: File[]) {
    if (busy || importing) return;
    importing = true; updateAvailability(); const errors: string[] = [];
    try {
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { errors.push(`${file.name}：暂不支持此格式，请选择 JPEG、PNG 或 WebP。`); continue; }
        if (photos.some(p => p.file.name === file.name && p.file.size === file.size && p.file.lastModified === file.lastModified)) continue;
        try {
          const thumb = await thumbnail(file);
          const p: Photo = { id: ++counter, file, thumb: thumb.blob, url: URL.createObjectURL(thumb.blob), width: thumb.width, height: thumb.height };
          photos.push(p); if (!selected) selected = p.id;
        } catch { errors.push(`${file.name}：图片无法读取。`); }
      }
      invalidate(); refreshGallery(); await updatePreview();
    } finally { importing = false; input.value = ''; updateAvailability(); showError(errors.join(' ')); }
  }
  async function importDemo() {
    if (!demo || busy || importing) return;
    await addFiles([new File([demo], '示例海边咖啡.png', { type: 'image/png', lastModified: 0 })]);
  }
  input.onchange = () => void addFiles(Array.from(input.files ?? []));
  el('remove-current').onclick = () => {
    if (busy || importing) return;
    const index = photos.findIndex(p => p.id === selected); if (index < 0) return;
    URL.revokeObjectURL(photos[index].url); photos.splice(index, 1); selected = photos[Math.min(index, photos.length - 1)]?.id ?? 0;
    invalidate(); refreshGallery(); void updatePreview();
  };
  const drop = el('drop-zone');
  drop.ondragover = e => { e.preventDefault(); if (!busy) drop.classList.add('dragging'); };
  drop.ondragleave = () => drop.classList.remove('dragging');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('dragging'); void addFiles(Array.from(e.dataTransfer?.files ?? [])); };
  function updateNote() { el('preview-note').textContent = `${view === 'platform' ? '平台布局示意' : '成品照片预览'}${photos.length ? '' : ' · 示例照片'}`; }
  async function updatePreview() {
    const request = ++generation;
    const photo = photos.find(p => p.id === selected); const blob = photo?.thumb ?? demo; if (!blob) return;
    try {
      const output = await renderPhoto(blob, getSettings(540)); if (request !== generation) return;
      const next = URL.createObjectURL(output.blob); el<HTMLImageElement>('preview-image').src = next;
      el<HTMLImageElement>('preview-image').alt = `${photo?.file.name ?? '示例照片'}，${ratio.join(':')} 画布成品预览`;
      if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = next; updateNote();
    } catch { if (request === generation) showError('预览生成失败，请重试或调整画布比例。'); }
  }
  const templateUrls: string[] = [];
  async function buildTemplateThumbnails() {
    if (!demo) return;
    for (const p of papers) {
      const output = await renderPhoto(demo, { ratio: [p.width / 2, p.height / 2], border: 0, style: 'paper', paper: p.id, outputWidth: 216, background: '#f7f7f5' });
      const url = URL.createObjectURL(output.blob); templateUrls.push(url); el<HTMLImageElement>(`paper-thumb-${p.id}`).src = url;
    }
    for (const preset of borders) {
      const output = await renderPhoto(demo, { ratio: [3, 4], border: preset.value, style: 'border', outputWidth: 180 });
      const url = URL.createObjectURL(output.blob); templateUrls.push(url); el<HTMLImageElement>(`border-thumb-${preset.name}`).src = url;
    }
    const output = await renderPhoto(demo, { ratio: [3, 4], border: 0, style: 'reference', outputWidth: 180 });
    const url = URL.createObjectURL(output.blob); templateUrls.push(url); el<HTMLImageElement>('reference-thumb').src = url;
  }
  el('run').onclick = () => { if (!busy && !importing && photos.length) generateHandler?.(); };
  el('cancel').onclick = () => cancelHandler?.();
  el('return-editor').onclick = () => showStep(2);
  function clearOutputs() { outputs.forEach(o => URL.revokeObjectURL(o.url)); outputs = []; el('result-gallery').replaceChildren(); el('delivery-status').textContent = ''; }
  function canShare(files: File[]) { try { return window.isSecureContext && typeof navigator.share === 'function' && navigator.canShare?.({ files }) === true; } catch { return false; } }
  async function shareFiles(files: File[], button: HTMLButtonElement) {
    if (button.disabled) return;
    button.disabled = true;
    try { await navigator.share({ files }); el('delivery-status').textContent = '系统分享面板已结束，请确认图片是否已保存。'; }
    catch (error) { el('delivery-status').textContent = error instanceof DOMException && error.name === 'AbortError' ? '已取消分享，生成的图片仍然保留。' : '系统分享未完成，可重试或逐张保存。'; }
    finally { button.disabled = false; }
  }
  function displayResults(items: Output[], failed: { name: string; reason: string }[], canceled = false) {
    clearOutputs(); outputs = items;
    el('result-summary').textContent = `${canceled ? '处理已取消 · ' : ''}成功 ${outputs.length} 张${failed.length ? ` · 失败 ${failed.length} 张` : ''}`;
    const list = el('failures'); list.replaceChildren(); failed.forEach(f => { const li = document.createElement('li'); li.textContent = `${f.name}：${f.reason}`; list.append(li); });
    outputs.forEach(o => {
      const card = document.createElement('article'); card.className = 'result-card';
      const img = document.createElement('img'); img.src = o.url; img.alt = o.file.name;
      const caption = document.createElement('p'); caption.textContent = `${o.width} × ${o.height} px`;
      const a = document.createElement('a'); a.href = o.url; a.download = o.file.name; a.className = 'secondary'; a.textContent = '保存这张图片';
      const open = document.createElement('a'); open.href = o.url; open.target = '_blank'; open.rel = 'noopener'; open.className = 'link-button'; open.textContent = '打开图片';
      card.append(img, caption, a, open); el('result-gallery').append(card);
      if (canShare([o.file])) {
        const share = document.createElement('button'); share.className = 'link-button'; share.textContent = '系统保存或分享';
        share.onclick = () => { if (canShare([o.file])) void shareFiles([o.file], share); else el('delivery-status').textContent = '系统分享不可用，请打开图片保存。'; }; card.append(share);
      }
    });
    const batchShare = outputs.length > 0 && canShare(outputs.map(o => o.file));
    const button = el<HTMLButtonElement>('share-results'); button.hidden = !batchShare;
    button.textContent = `保存或分享 ${outputs.length} 张照片`;
    el('delivery-note').textContent = batchShare ? '点击打开系统分享面板，选择保存位置或接收应用。' : outputs.length ? '此浏览器不支持批量文件分享。可逐张保存，或打开图片后使用系统保存操作。' : '请返回调整后重新生成。';
    button.onclick = () => {
      if (!outputs.length || button.disabled) return;
      const files = outputs.map(o => o.file);
      if (!canShare(files)) { button.hidden = true; el('delivery-status').textContent = '批量分享不可用，请逐张保存。'; return; }
      void shareFiles(files, button);
    };
    showStep(3);
  }
  function setBusy(value: boolean) {
    busy = value; el('processing').hidden = !value;
    document.querySelector<HTMLElement>('main')!.inert = value;
    document.querySelector<HTMLElement>('.app-header')!.inert = value;
    if (value) el('cancel').focus();
    document.querySelectorAll<HTMLButtonElement>('.app-header button,.editor-page button,.intro-page button').forEach(b => b.disabled = value);
    updateAvailability();
    if (!value) document.querySelector<HTMLElement>('.page:not([hidden]) h1')?.focus({ preventScroll: true });
  }
  syncSettings(); refreshGallery(); showStep(0);
  void (async () => {
    try { const response = await fetch(demoPath); if (!response.ok) throw new Error('Demo unavailable'); demo = await response.blob(); await updatePreview(); await buildTemplateThumbnails(); }
    catch { showError('示例照片加载失败，可继续添加自己的照片。'); }
  })();
  window.addEventListener('pagehide', event => { if (event.persisted) return; photos.forEach(p => URL.revokeObjectURL(p.url)); clearOutputs(); templateUrls.forEach(url => URL.revokeObjectURL(url)); if (previewUrl) URL.revokeObjectURL(previewUrl); });
  return {
    getPhotos: () => [...photos], getSettings,
    onGenerate: (handler: () => void) => { generateHandler = handler; },
    onCancel: (handler: () => void) => { cancelHandler = handler; },
    onInvalidate: (handler: () => void) => { invalidateHandler = handler; },
    setBusy, clearOutputs, displayResults,
    setProgress: (done: number, total: number) => { const progress = el<HTMLProgressElement>('progress'); progress.max = total; progress.value = done; el('status').textContent = `${done} / ${total}`; },
    showError,
  };
}
