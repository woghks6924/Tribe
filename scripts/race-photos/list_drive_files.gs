// 구글 드라이브 폴더의 "파일명,파일ID" 목록을 CSV로 뽑는 Apps Script
// 쓰는 법: https://script.google.com -> 새 프로젝트 -> 이 코드를 붙여넣기 -> FOLDER_ID 바꾸기 -> 실행(listFiles)
// 결과: 내 드라이브 맨 위에 ids.csv 파일이 생겨요. 다운로드해서 make_index.py의 --ids로 넘기면 돼요.
const FOLDER_ID = '여기에_폴더_ID'; // 예: https://drive.google.com/drive/folders/XXXX 에서 XXXX 부분

function listFiles() {
  const rows = ['filename,driveId'];
  walk(DriveApp.getFolderById(FOLDER_ID), rows);
  DriveApp.createFile('ids.csv', rows.join('\n'), MimeType.CSV);
  Logger.log('완료: ' + (rows.length - 1) + '개 -> 내 드라이브의 ids.csv');
}

// 하위 폴더까지 전부 훑는다.
function walk(folder, rows) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    rows.push(f.getName().replace(/,/g, ' ') + ',' + f.getId());
  }
  const subs = folder.getFolders();
  while (subs.hasNext()) walk(subs.next(), rows);
}
