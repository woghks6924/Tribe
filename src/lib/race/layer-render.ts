import {
  assetPath,
  BOTTOM_FIT,
  HAIR_FIT,
  SHOE_FIT,
  TOP_FIT,
  type LayerFit,
  type RaceAppearance,
} from "@/lib/race/appearance";

// 레이어드 픽셀아트 캐릭터 렌더러. public/race-parts/의 실제 PNG 에셋을 몸통(스킨톤별로
// 이미 완성된 이미지) 위에 순서대로(하의→상의→신발→머리) 합성한다. 옷/머리는 중립색
// 에셋을 곱연산(multiply)으로 tint해서 원하는 색을 입힌다.
//
// 애니메이션 루프(race-track.tsx의 requestAnimationFrame)에서 매 프레임 호출되므로,
// 이미지 로딩과 tint 결과를 모두 캐시해두고 실제 draw는 완전히 동기(sync)로 처리한다 —
// 그래서 사용 순서는 항상 preloadRaceAppearance(비동기, 1회) → drawRaceCharacter(동기, 반복).

const imageCache = new Map<string, HTMLImageElement>();
const imageLoading = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);
  const loading = imageLoading.get(src);
  if (loading) return loading;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      imageLoading.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      imageLoading.delete(src);
      reject(new Error(`이미지를 불러오지 못했어요: ${src}`));
    };
    img.src = src;
  });
  imageLoading.set(src, p);
  return p;
}

const tintCache = new Map<string, HTMLCanvasElement>();

// 흰색/연회색 중립 에셋을 지정한 색으로 물들인다 — 음영(라인/그림자)은 유지하고 색조만 바뀐다.
// 기법: (1) 원본을 그대로 그려 알파 모양을 만든다 (2) multiply로 색을 곱한다
// (이 시점엔 투명했던 영역도 불투명하게 덮인다) (3) destination-in으로 원본 알파를 다시
// 씌워서 투명 영역을 복구한다.
function tintGrayscale(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const key = `${img.src}|${color}`;
  const cached = tintCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  tintCache.set(key, canvas);
  return canvas;
}

function assetsFor(appearance: RaceAppearance): { path: string; color?: string; fit?: LayerFit }[] {
  const { gender } = appearance;
  return [
    { path: assetPath("body", `${gender}-${appearance.skinTone}`) },
    { path: assetPath("bottom", appearance.bottomType, gender), color: appearance.bottomColor, fit: BOTTOM_FIT[appearance.bottomType] },
    { path: assetPath("top", appearance.topType, gender), color: appearance.topColor, fit: TOP_FIT[appearance.topType] },
    { path: assetPath("shoe", appearance.shoeType), fit: SHOE_FIT[appearance.shoeType] },
    { path: assetPath("hair", appearance.hairStyle), color: appearance.hairColor, fit: HAIR_FIT[appearance.hairStyle] },
  ];
}

export async function preloadRaceAppearance(appearance: RaceAppearance): Promise<void> {
  const layers = assetsFor(appearance);
  const images = await Promise.all(layers.map((l) => loadImage(l.path)));
  layers.forEach((l, i) => {
    if (l.color) tintGrayscale(images[i], l.color);
  });
}

// targetHeight: 몸통(body) 이미지를 이 픽셀 높이로 스케일해서 (x,y)를 좌상단으로 그린다.
// 프리로드가 끝나지 않은 이미지는 조용히 건너뛴다(몸통이 없으면 아무것도 안 그림).
export function drawRaceCharacter(
  ctx: CanvasRenderingContext2D,
  appearance: RaceAppearance,
  x: number,
  y: number,
  targetHeight: number,
): void {
  const layers = assetsFor(appearance);
  const bodyImg = imageCache.get(layers[0].path);
  if (!bodyImg) return; // 아직 로딩 전 — 다음 프레임에 다시 그려짐

  const bodyScale = targetHeight / bodyImg.naturalHeight;
  const bodyWidth = bodyImg.naturalWidth * bodyScale;
  const bodyX = x - bodyWidth / 2;
  ctx.drawImage(bodyImg, bodyX, y, bodyWidth, targetHeight);

  for (let i = 1; i < layers.length; i++) {
    const layer = layers[i];
    const img = imageCache.get(layer.path);
    if (!img || !layer.fit) continue;
    const source = layer.color ? tintGrayscale(img, layer.color) : img;
    const itemScale = bodyScale * layer.fit.scale;
    const itemW = img.naturalWidth * itemScale;
    const itemH = img.naturalHeight * itemScale;
    const itemX = x - itemW / 2;
    const itemY = y + targetHeight * layer.fit.topRatio;
    ctx.drawImage(source, itemX, itemY, itemW, itemH);
  }
}

export async function renderRaceAvatarDataUrl(appearance: RaceAppearance, targetHeight = 88): Promise<string> {
  await preloadRaceAppearance(appearance);
  const layers = assetsFor(appearance);
  const bodyImg = await loadImage(layers[0].path);
  const bodyScale = targetHeight / bodyImg.naturalHeight;
  const bodyWidth = bodyImg.naturalWidth * bodyScale;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bodyWidth) + 40;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;
  drawRaceCharacter(ctx, appearance, canvas.width / 2, 0, targetHeight);
  return canvas.toDataURL("image/png");
}
