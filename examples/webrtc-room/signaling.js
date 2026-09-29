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
