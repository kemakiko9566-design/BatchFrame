import { createUI, type Output } from './ui';
import { renderPhoto } from './images';

const ui = createUI();
let canceled = false, version = 0;
ui.onCancel(() => { canceled = true; });
ui.onInvalidate(() => { version++; ui.clearOutputs(); });
ui.onGenerate(async () => {
  const photos = ui.getPhotos(); if (!photos.length) return;
  const settings = ui.getSettings(); const runVersion = version;
  canceled = false; ui.setBusy(true); ui.clearOutputs(); ui.setProgress(0, photos.length);
  const outputs: Output[] = [];
  const failures: { name: string; reason: string }[] = [];
  try {
    for (let index = 0; index < photos.length; index++) {
      if (canceled || runVersion !== version) break;
      // Sequential rendering bounds decoded image memory and yields between photos.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (canceled) break;
      const photo = photos[index];
      try {
        const result = await renderPhoto(photo.file, settings);
        if (canceled || runVersion !== version) break;
        const name = `${String(index + 1).padStart(3, '0')}-${photo.file.name.replace(/\.[^.]+$/, '')}-frame.jpg`;
        const file = new File([result.blob], name, { type: 'image/jpeg' });
        outputs.push({ id: photo.id, file, url: URL.createObjectURL(file), width: result.width, height: result.height });
      } catch (error) { failures.push({ name: photo.file.name, reason: error instanceof Error ? error.message : '无法生成图片' }); }
      ui.setProgress(index + 1, photos.length);
    }
    ui.displayResults(outputs, failures, canceled);
  } catch {
    outputs.forEach(output => URL.revokeObjectURL(output.url));
    ui.showError('处理失败，请重新尝试。');
  } finally { ui.setBusy(false); }
});
