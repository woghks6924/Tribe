// 구글 드라이브 폴더의 "파일명 → 파일 ID" 목록을 뽑는 Apps Script.
//
// [자동 연동 — 한 번만 설정]
//  1) https://script.google.com 에서 새 프로젝트를 만들고 이 코드를 전부 붙여넣어요.
//  2) 왼쪽 톱니(프로젝트 설정) → 스크립트 속성 → "스크립트 속성 추가"
//       속성: TOKEN   값: 아무도 모를 긴 문자열(예: 영문+숫자 32자 이상)
//  3) 오른쪽 위 배포 → 새 배포 → 유형: 웹 앱
//       설명: race photo lister / 실행 사용자: 나 / 액세스 권한이 있는 사용자: 모든 사용자 → 배포
//     (처음에는 권한 승인 창이 떠요. 본인 계정으로 허용하면 돼요.)
//  4) 나오는 "웹 앱 URL"(https://script.google.com/macros/s/.../exec)과 위 TOKEN 값을
//     사이트 환경변수 RACE_PHOTO_LISTER_URL, RACE_PHOTO_LISTER_TOKEN 에 넣어요.
//  이후에는 admin의 "사진 올리기"가 알아서 이 웹 앱을 호출해서 드라이브 파일 ID를 가져가요.
//  (토큰을 모르면 아무도 목록을 못 받아요. 코드를 고치면 배포 → 배포 관리 → 새 버전으로 다시 배포하세요.)

function doGet(e) {
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  const p = (e && e.parameter) || {};
  if (!token || p.token !== token) return json_({ error: 'unauthorized' });
  if (!p.folder) return json_({ error: 'folder is required' });
  try {
    const files = [];
    walk_(DriveApp.getFolderById(p.folder), files);
    return json_({ files: files });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

// [수동 실행용] 편집기에서 listFiles를 실행하면 내 드라이브에 ids.csv가 생겨요. (자동 연동을 안 쓸 때)
const FOLDER_ID = '여기에_폴더_ID';
function listFiles() {
  const files = [];
  walk_(DriveApp.getFolderById(FOLDER_ID), files);
  const rows = ['filename,driveId'].concat(files.map(function (f) { return f.name.replace(/,/g, ' ') + ',' + f.id; }));
  DriveApp.createFile('ids.csv', rows.join('\n'), MimeType.CSV);
  Logger.log('완료: ' + files.length + '개 -> 내 드라이브의 ids.csv');
}

// 하위 폴더까지 전부 훑는다.
function walk_(folder, out) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    out.push({ name: f.getName(), id: f.getId() });
  }
  const subs = folder.getFolders();
  while (subs.hasNext()) walk_(subs.next(), out);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
