---
title: "실시간 스터디룸의 연결"
slug: webrtc-room
order: 20
level: "중급"
minutes: 40
tags: [WebRTC]
summary: "두 탭이 코드 조각을 주고받도록 신호, SDP, ICE를 역할로 나눕니다."
---

# 실시간 스터디룸의 연결

## 도입

이 장은 samsepi0l이 두 브라우저가 코드 조각을 주고받는 연결을 정리한 노트입니다. 예제 페이지는 신호 채널을 같은 브라우저의 탭으로 대신합니다. 보내는 값은 입력칸에 적힌 텍스트입니다. 카메라, 마이크, 화면을 열지 않습니다. 학습자가 치지 않은 것을 수집하지 않습니다.

연결은 두 층입니다. 신호는 접속을 성사시키기 위한 설정 메시지의 통로입니다. 데이터는 그 다음에 `RTCPeerConnection`이 옮기는 조각입니다. 표준은 피어 연결을 정의할 뿐, 첫 메시지를 배달하는 방법은 정의하지 않습니다. 그래서 신호 채널이 먼저 필요합니다.

수업의 상태 기계는 `examples/webrtc-room/signaling.js`입니다. 네트워크를 열지 않습니다. `examples/webrtc-room`에서 `node signaling.test.js`를 실행합니다. 페이지는 `public/room.html`이며 브라우저 안에서만 동작합니다.

## 이 장을 끝내면

- 신호 메시지와 데이터 채널의 페이로드를 구분합니다.
- SDP offer와 answer, ICE candidate가 각각 무엇을 전달하는지 말합니다.
- `BroadcastChannel`이 수업용 대역이지 운영용 신호 서버가 아닌 이유를 설명합니다.

## 신호와 데이터

신호로 오가는 것은 세션 설명과 후보 주소입니다. 코드 조각 자체가 신호의 목적은 아닙니다. 다만 수업 페이지는 조각 텍스트도 신호 대역에 실어, WebRTC가 없거나 아직 채널이 열리지 않아도 상대 탭의 기록에 남게 합니다.

데이터가 지나는 길은 이름이 `"snippet"`인 데이터 채널입니다. 오디오나 영상을 실어 나르는 트랜시버가 아닙니다. 제안하는 쪽이 `createOffer` 전에 `createDataChannel("snippet")`을 호출해야 그 채널이 세션 설명에 포함됩니다. 응답하는 쪽은 채널을 다시 만들지 않고, `ondatachannel`에서 라벨이 `snippet`인 것만 받습니다.

아래 그림에서 등호 위의 화살표는 신호 채널입니다. 등호는 양쪽 설명이 반영되고 후보 쌍이 통한 뒤에야 생기는 데이터 채널입니다.

```text
탭 A (제안)                         탭 B (응답)
   |                                    |
   |---------- SDP offer -------------->|
   |---------- ICE candidate ---------->|
   |<--------- SDP answer --------------|
   |<--------- ICE candidate -----------|
   |====== data channel "snippet" ======|
```

## SDP offer와 answer

SDP는 세션을 글로 적은 텍스트입니다. 데이터 채널이 있다는 사실, ICE 자격, DTLS 지문이 들어 있습니다. 지문은 나중에 암호화된 연결의 상대를 확인하는 값이며, 이 장은 그 세부 절차를 구현하지 않습니다.

offer는 한쪽에 제안하는 설명입니다. answer는 상대가 그에 맞춰 만든 설명입니다. 제안 쪽은 offer를 지역 설명으로 둔 뒤 신호로 보냅니다. 응답 쪽은 그것을 원격 설명으로 두고 answer를 만들어 지역 설명으로 둔 다음 돌려보냅니다. 제안 쪽은 그 answer를 원격 설명으로 둡니다.

상태 기계는 이 순서를 방 하나의 상태로 기록합니다. `idle`에서 `offer`를 받으면 `have-offer`가 됩니다. `have-offer`에서 `answer`를 받으면 `connected`가 됩니다. 여기서 `connected`는 answer가 저장되었다는 뜻입니다. ICE가 길을 찾았다는 뜻도, 데이터 채널의 `onopen`이 발생했다는 뜻도 아닙니다. 후보 교환이 실패하면 SDP는 맞춰졌는데도 채널은 열리지 않을 수 있습니다.

`offer`는 상태가 `idle`이 아니면 `double-offer`로 실패하고 기존 SDP를 덮지 않습니다. 두 제안이 동시에 생기면 어느 쪽 설명을 기준으로 할지 규칙이 더 필요합니다. 이 수업은 그 규칙을 만들지 않고, 제안을 한 번만 허용합니다. `answer`는 `have-offer`에서만 받습니다. 빈 문자열은 상태를 바꾸기 전에 거절합니다.

## ICE candidate

ICE는 패킷을 받을 수 있는 주소 후보를 모으고, 양쪽 후보의 쌍을 시험합니다. 자기 인터페이스 주소가 호스트 후보입니다. 외부에서 보이는 주소나 중계 주소는 별도 서버가 있어야 합니다.

페이지는 `iceServers`를 빈 배열로 둡니다. 후보를 물어볼 STUN이나 TURN 주소를 적지 않았고, 페이지 안의 다른 코드도 외부 주소로 요청을 보내지 않습니다. 같은 기기 안의 호스트 후보만 기대합니다. 그 쌍이 실패해도 조각은 `BroadcastChannel` 경로로 남습니다.

`setLocalDescription` 직후 후보가 생길 수 있고, 그 메시지가 offer보다 먼저 처리될 수도 있습니다. 원격 설명이 아직 없으면 페이지는 후보를 `iceQueue`에 넣었다가, 원격 설명이 생긴 뒤 `flushIce`로 반영합니다.

## 신호 채널이 먼저인 이유

`RTCPeerConnection`은 상대 탭의 주소를 처음부터 알지 못합니다. offer와 후보는 그냥 데이터입니다. 그것을 옮길 기존 통로가 없으면 상대는 제안을 받을 수 없고, 제안을 받기 전에는 데이터 채널도 없습니다. 데이터 채널로 offer를 보내겠다는 설계는 순서가 뒤집힌 것입니다. 신호 채널이 먼저입니다.

운영 환경의 신호 채널은 두 기기가 모두 닿는 서버인 경우가 많습니다. 방 식별과 누가 그 방에 들어왔는지도 거기서 다룹니다. 이 장의 Node 테스트는 그 서버를 만들지 않습니다. 상태 전이만 검사합니다.

## BroadcastChannel은 수업용 대역입니다

`BroadcastChannel`은 같은 브라우저, 같은 출처의 다른 탭으로 메시지를 복사하는 브라우저 API입니다. 다른 컴퓨터나 다른 브라우저로는 가지 않습니다. 접속이 끝나도 메시지를 보관하지 않고, 누가 방에 들어왔는지 확인하지도 않습니다.

그래서 `BroadcastChannel`은 수업용 대역이지 운영용 신호 서버가 아닙니다. 페이지가 이 API를 쓰는 이유는 서버 없이 신호의 순서를 보여 주기 위해서입니다. 채널 이름은 `study-snippet-room`입니다. 같은 출처의 탭을 두 개 열어야 합니다. 디스크의 파일을 각 탭이 다른 불투명 출처로 열면 채널이 닿지 않을 수 있습니다.

페이지의 `phase`는 탭마다 따로 있습니다. 제안 탭은 answer를 반영할 때까지 `have-offer`이고, 응답 탭은 answer를 보낸 뒤 `connected`가 됩니다. 이름만 상태 기계와 같고, 같은 객체는 아닙니다. `RTCPeerConnection`이 없으면 제안 버튼도 조각 메시지만 보내고, 수신 탭은 그 텍스트를 기록합니다.

## 예제

`examples/webrtc-room/signaling.js` 전체입니다.

```javascript
export class Signaling {
  constructor() {
    this.state = "idle";
    this.offerSdp = null;
    this.answerSdp = null;
  }

  offer(sdp) {
    if (this.state !== "idle") {
      throw new Error("double-offer");
    }
    if (typeof sdp !== "string" || sdp.length === 0) {
      throw new Error("sdp must be a non-empty string");
    }
    this.offerSdp = sdp;
    this.state = "have-offer";
    return this.state;
  }

  answer(sdp) {
    if (this.state !== "have-offer") {
      throw new Error("answer requires have-offer");
    }
    if (typeof sdp !== "string" || sdp.length === 0) {
      throw new Error("sdp must be a non-empty string");
    }
    this.answerSdp = sdp;
    this.state = "connected";
    return this.state;
  }
}
```

`examples/webrtc-room/signaling.test.js` 전체입니다.

```javascript
import assert from "node:assert/strict";
import { Signaling } from "./signaling.js";

const room = new Signaling();
assert.equal(room.state, "idle");
assert.equal(room.offer("v=0 offer"), "have-offer");
assert.equal(room.state, "have-offer");
assert.equal(room.offerSdp, "v=0 offer");

assert.throws(() => room.offer("v=0 again"), /double-offer/);
assert.equal(room.state, "have-offer");
assert.equal(room.offerSdp, "v=0 offer");

assert.equal(room.answer("v=0 answer"), "connected");
assert.equal(room.state, "connected");
assert.equal(room.answerSdp, "v=0 answer");
assert.throws(() => room.offer("v=0 late"), /double-offer/);
assert.throws(() => room.answer("v=0 late"), /answer requires have-offer/);

const early = new Signaling();
assert.throws(() => early.answer("v=0 early"), /answer requires have-offer/);
assert.equal(early.state, "idle");
assert.throws(() => early.offer(""), /non-empty string/);
assert.equal(early.state, "idle");

console.log("signaling.test.js passed");
```

아래 두 발췌는 `examples/webrtc-room/public/room.html`의 해당 줄과 같습니다. 앞부분은 WebRTC가 있을 때만 연결을 만들고, 뒷부분은 조각 전달과 한 번의 제안을 담당합니다.

```html
    function hasWebRtc() {
      return "RTCPeerConnection" in window;
    }

    function connection() {
      if (!hasWebRtc()) {
        return null;
      }
      if (pc) {
        return pc;
      }
      pc = new RTCPeerConnection({ iceServers: [] });
      pc.onicecandidate = function (event) {
        if (event.candidate) {
          post("ice", { candidate: event.candidate.toJSON() });
        }
      };
      pc.ondatachannel = function (event) {
        if (event.channel.label === "snippet") {
          bindChannel(event.channel);
        }
      };
      return pc;
    }
```

```html
    function sendSnippet() {
      const text = snippetEl.value;
      post("snippet", { text: text });
      if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(text);
        setStatus("데이터 채널과 BroadcastChannel로 보냈습니다");
        return;
      }
      setStatus("BroadcastChannel로 조각을 보냈습니다");
    }

    async function sendOffer() {
      const peer = connection();
      if (!peer) {
        sendSnippet();
        setStatus("WebRTC가 없어 BroadcastChannel만 사용합니다");
        return;
      }
      if (phase !== "idle") {
        setStatus("제안은 한 번만 보냅니다");
        return;
      }
      phase = "have-offer";
      try {
        bindChannel(peer.createDataChannel("snippet"));
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        post("offer", {
          description: { type: peer.localDescription.type, sdp: peer.localDescription.sdp },
        });
        setStatus("SDP 제안을 보냈습니다");
      } catch (error) {
        phase = "idle";
        throw error;
      }
    }
```

## 연습

1. `signaling.test.js`를 실행한 뒤, `offer`를 두 번 호출하면 상태가 왜 `have-offer`에 머무는지 테스트 단언과 맞춰 설명합니다.
2. 페이지에서 SDP 메시지와 `type`이 `snippet`인 메시지를 나누고, 어느 쪽이 신호인지 적습니다.
3. `iceServers`가 빈 배열일 때 페이지가 후보를 묻기 위해 적는 서버 주소가 있는지 코드에서 확인합니다.

## 스스로 확인

### 1. offer를 데이터 채널로 보내면 안 되는 이유는 무엇입니까?

답: 데이터 채널은 양쪽 세션 설명이 반영된 뒤에야 열립니다. 그 설명인 offer를 배달하려면 더 이전의 신호 채널이 필요합니다.

### 2. 상태 `connected`는 무엇을 의미합니까?

답: answer SDP가 받아들여졌다는 의미입니다. ICE가 경로를 찾았거나 `snippet` 채널이 열렸다는 의미는 아닙니다.

### 3. 두 번째 `offer`는 어떻게 됩니까?

답: `double-offer` 예외가 나고 상태와 기존 SDP는 바뀌지 않습니다. 페이지도 `idle`이 아니면 새 제안을 만들지 않습니다.

### 4. `BroadcastChannel`을 운영용 신호 서버로 쓸 수 있습니까?

답: 쓸 수 없습니다. 같은 브라우저의 같은 출처 탭에만 닿는 수업용 대역이며, 운영용 신호 서버가 아닙니다. 다른 기기, 인증, 보관이 없습니다.

### 5. `RTCPeerConnection`이 없는 브라우저에서도 조각이 보이는 이유는 무엇입니까?

답: 페이지가 조각 텍스트를 `BroadcastChannel` 메시지로도 보내기 때문입니다. WebRTC는 없을 때 생략되고, 기록 영역은 그 메시지를 표시합니다.
