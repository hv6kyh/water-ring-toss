# Water Ring Toss Game - Project Context

## 1. 프로젝트 개요 (Project Overview)
이 프로젝트는 React Native (Expo)와 Matter.js 물리 엔진을 활용하여 만든 '수중 고리 던지기' 레트로 아케이드 게임입니다.
기본적인 목표는 하단의 버튼을 눌러 공기 방울(수직 힘)을 발생시키고, 물속에서 천천히 가라앉는 링들을 중앙의 막대기(Peg)에 모두 끼워 넣는 것입니다.

## 2. 주요 기술 스택 (Tech Stack)
*   **프레임워크:** React Native (Expo SDK 54), TypeScript
*   **물리 엔진:** `matter-js`
*   **센서 및 피드백:** `expo-sensors` (Accelerometer), `expo-haptics`
*   **오디오:** `expo-av`
*   **렌더링 방식:** Matter.js 결과값을 기반으로 한 순수 `React State` 절댓값 포지셔닝 렌더링 (모바일 및 웹 완벽 호환)

## 3. 아키텍처 및 폴더 구조 (Architecture)
*   `App.tsx`: 애플리케이션의 진입점(Entry Point). 전체 UI 레이아웃, 오디오 초기화, 그리고 최종 골인(Success) 판정 로직을 주기적으로 검사하는 역할을 담당합니다.
*   `src/physics.ts`: Matter.js 물리 엔진 초기화, 링(Ring)과 중앙 막대(Peg)의 생성, 부력(Buoyancy) 적용, 외부 노즐 힘 전달 등 **렌더링과 독립된 순수 역학 연산**을 수행합니다.
*   `src/components/GameEngine.tsx`: `physics.ts`에서 연산된 `engine.world.bodies`의 좌표 모델을 `requestAnimationFrame` 루프를 통해 가져와, View 컴포넌트의 좌표 상태(`useState`)로 렌더링하는 뷰 계층입니다.
*   `src/components/Controls.tsx`: 하단의 물리 버튼 인터페이스, 햅틱 연동 및 `physics.ts`의 힘 적용 함수를 트리거합니다.
*   `src/hooks/useSensor.ts`: 기기의 기울기(Accelerometer) 값을 로우패스 필터링하여 부드러운 중력 변화값으로 반환합니다.

## 4. 현재 구현 상태 (Implemented Features)
*   [x] Matter.js 물리 엔진 초기화 및 루프 구축 (`GameEngine.tsx` State 기반 60fps Web/App 호환 렌더링).
*   [x] 복합 바디(Composite Body) 기반의 링 구조 (8개 파츠 + 중심부 투명 센서).
*   [x] `frictionAir` 및 매 프레임 Anti-gravity 힘을 통한 물속 부력(Buoyancy) 시뮬레이션.
*   [x] 좌/우 버튼 클릭 시 지정 노즐 반경 내의 링에만 작용하는 거리 비례 역자승 공기압(Upward Force) 로직.
*   [x] 모바일 기기 자이로 센서(Accelerometer) 연동 및 로우패스 필터 안정화.
*   [x] 모든 링이 막대에 걸렸을 때의 기본 골인 판정 로직 (`App.tsx`).
*   [x] Expo 라우터 템플릿 찌꺼기 제거 및 `App.tsx` 다이렉트 엔트리 연결 수정 완료.

## 5. 미구현 및 향후 진행 작업 (Unimplemented & Next Tasks)
현재 핵심 로직은 작성되었으나 디자인적 완성도와 사용자 경험을 높이기 위한 작업들이 남아있습니다.
*   **에셋 적용 (Assets & Polish):** 실제 배경 그래픽 이미지, 링/막대기 스프라이트 이미지, 공기 방울 파티클 이펙트 등 시각 효과 고도화.
*   **사운드 통합 (Audio):** `bubble.mp3`, `ding.mp3`, 배경음악(BGM) 등 실제 오디오 파일 로드 및 이벤트 트리거 시 플레이.
*   **골인 판정 고도화 (Refinement):** 현재 거리 기반의 단순 Success Checker에서 Matter.js Event를 활용한 정밀한 골인 애니메이션 및 파티클 피드백 연결.
*   **난이도 조절 (Level Design):** 링의 무게, 갯수, 물의 저항 등을 조정하여 스테이지화 또는 난이도 곡선 설계.

> [!NOTE]
> 본 `project_context.md` 문서는 프로젝트 전역에서 에이전트와 개발자가 컨텍스트를 동기화하고 향후 병렬 작업을 기획하는 데 사용됩니다.
