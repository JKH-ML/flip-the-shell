# Flip the Shell 🐚 + SnailShell 🐌

**Flip the Shell**은 웹에 업로드된 **Shell Image** 속에 숨겨진 데이터(이미지, 비디오 등)를 실시간으로 탐지하고 즉시 추출하여 보여주는 강력한 크롬 확장 프로그램입니다. 

이 도구는 [ComfyUI-SnailShell](https://github.com/JKH-ML/ComfyUI-SnailShell) 커스텀 노드와 완벽하게 연동되어, 복잡한 디코딩 과정 없이 브라우저에서 바로 숨겨진 콘텐츠를 확인할 수 있게 해줍니다.

## 🌟 핵심 기능: SNAIL 스테가노그래피 연동

단순히 쉘을 탐지하는 것을 넘어, **SNAIL 프로토콜**로 암호화/압축되어 숨겨진 데이터를 웹 환경에서 즉시 복원합니다.

- **실시간 탐지:** 웹페이지의 이미지를 마우스 오버만 해도 내부에 숨겨진 데이터가 있는지 스캔합니다.
- **SNAIL 시그니처 인식:** `k-auto-scan` 알고리즘을 통해 이미지의 비트 깊이(k=2, 4, 8)와 상관없이 숨겨진 데이터를 찾아냅니다.
- **즉시 추출 및 재생:** 숨겨진 것이 이미지라면 팝업으로 보여주고, **비디오(MP4)**라면 즉시 스트리밍 재생합니다.
- **CORS 우회:** 보안 정책이 까다로운 사이트에서도 확장 프로그램의 권한을 이용해 이미지를 분석합니다.

## 🛠 사용 방법 (The Snail Workflow)

### 1. 데이터 숨기기 (ComfyUI)
[ComfyUI-SnailShell](https://github.com/JKH-ML/ComfyUI-SnailShell)을 사용하여 일반적인 이미지(Shell) 안에 비밀스러운 이미지나 비디오를 숨긴 결과물을 생성합니다. 이 결과물은 겉보기에는 일반 이미지와 동일합니다.

### 2. 웹에 업로드 및 공유
생성된 이미지를 커뮤니티나 SNS 등에 업로드합니다.

### 3. 데이터 확인 (Flip the Shell)
- **Flip the Shell**이 설치된 브라우저로 해당 이미지를 봅니다.
- 이미지 위에 마우스를 올리면 중앙(혹은 설정된 위치)에 **돋보기 아이콘**이 나타납니다.
- 아이콘을 클릭하면 내부에 숨겨져 있던 이미지나 비디오가 원본 화질로 즉시 나타납니다!

## 🚀 설치 안내

### [크롬 웹스토어에서 바로 설치](https://chromewebstore.google.com/detail/flip-the-shell/opplmeompodbeojbbccnllpbjhcbnnbn?hl=ko&utm_source=ext_sidebar)

### 개발자 모드 설치
1. 본 저장소를 클론합니다.
2. `chrome://extensions/`에서 '개발자 모드'를 켭니다.
3. '압축해제된 확장 프로그램을 로드'하여 폴더를 선택합니다.

## 💻 기술적 세부사항

- **SNAIL Protocol:** 비트 가변형 스테가노그래피 알고리즘 (Custom Implementation)
- **Performance:** `WeakMap` 캐싱과 `willReadFrequently` 캔버스 최적화로 브라우징 성능 유지
- **Compatibility:** Manifest V3 기반, 최신 크롬 브라우저 최적화

## 📄 정책 및 주의사항

- **Privacy Policy:** [index.html](./index.html) (Chrome Web Store 필수 요건)
- 본 도구는 보안 연구 및 창의적인 데이터 공유 목적으로 제작되었습니다. 타인의 권리를 침해하는 용도로 사용하지 마십시오.

---
**Maintained by [JKH-ML](https://github.com/JKH-ML)**
