# 이미지 교체 가이드 — landing-v2

이 폴더의 SVG 파일들은 임시 placeholder입니다.
**같은 파일명으로 실제 이미지(PNG/JPG/WEBP)를 덮어쓰기하면 바로 반영**됩니다.

단, 코드에서 `.svg` 확장자로 연결되어 있으므로
PNG/JPG로 교체할 경우 `index.html` 내 해당 `<img src="">` 경로의 확장자도 함께 변경해주세요.

---

## 히어로 슬라이드 이미지 (5장)

| 파일명 | 위치 | 권장 크기 | 내용 |
|---|---|---|---|
| `hero-slide-01-partner-recruit.svg` | 히어로 슬라이드 1번 배경/비주얼 | 800×480 | 만능맨 파트너스 사전 모집 안내 |
| `hero-slide-02-equipment-experts.svg` | 히어로 슬라이드 2번 배경/비주얼 | 800×480 | 배관·수도·보일러·누수 설비 전문가 모집 |
| `hero-slide-03-request-matching.svg` | 히어로 슬라이드 3번 배경/비주얼 | 800×480 | 현장 의뢰 연결 플랫폼 소개 |
| `hero-slide-04-payment-settlement.svg` | 히어로 슬라이드 4번 배경/비주얼 | 800×480 | 작업 후 정산/결제 흐름 안내 |
| `hero-slide-05-event-benefit.svg` | 히어로 슬라이드 5번 배경/비주얼 | 800×480 | 초기 파트너 혜택/이벤트 안내 |

---

## 섹션 이미지

| 파일명 | 위치 | 권장 크기 | 내용 |
|---|---|---|---|
| `section-benefit-card-01.svg` | 혜택 섹션 카드 비주얼 1 | 480×320 | 혜택 강조 카드 (좌측) |
| `section-benefit-card-02.svg` | 혜택 섹션 카드 비주얼 2 | 480×320 | 혜택 강조 카드 (우측) |
| `section-platform-intro.svg` | 플랫폼 소개 섹션 우측 이미지 | 640×420 | 기술자-고객 연결 비주얼 |
| `section-partner-recruit.svg` | 파트너 모집 섹션 이미지 | 640×420 | 현장 전문가 활동 비주얼 |
| `section-process-flow.svg` | 운영 흐름 섹션 배경/보조 이미지 | 960×320 | 프로세스 플로우 일러스트 |
| `section-faq-visual.svg` | FAQ 섹션 보조 비주얼 | 480×320 | FAQ 보조 일러스트 |

---

## 교체 방법

1. 같은 폴더(`assets/image-placeholders/`)에 동일한 파일명으로 이미지를 넣으세요.
2. SVG → PNG/JPG/WEBP로 바꾸는 경우, `index.html` 내 해당 `<img src>` 경로 확장자를 수정하세요.
3. 이미지 비율은 권장 크기에 맞게 제작하면 레이아웃이 자연스럽게 유지됩니다.
