// Single source of truth for the lens UX. The lens renders from state only.
export const STATES = Object.freeze([
  "IDLE", "LISTENING", "AMOUNT_HEARD", "RESOLVING", "PICK_MERCHANT",
  "CONFIRM", "SIGNING", "PENDING", "SUCCESS", "FAILED", "CANCELLED", "TIMEOUT",
]);

const ALLOWED = Object.freeze({
  IDLE: ["LISTENING"],
  LISTENING: ["AMOUNT_HEARD", "CANCELLED", "TIMEOUT"],
  AMOUNT_HEARD: ["RESOLVING", "CANCELLED", "TIMEOUT"],
  RESOLVING: ["PICK_MERCHANT", "CONFIRM", "FAILED", "TIMEOUT"],
  // CONFIRM -> RESOLVING is the stale-quote re-quote path (never sign stale).
  PICK_MERCHANT: ["CONFIRM", "CANCELLED", "TIMEOUT"],
  CONFIRM: ["SIGNING", "RESOLVING", "CANCELLED", "TIMEOUT"],
  SIGNING: ["PENDING", "FAILED"],
  PENDING: ["SUCCESS", "FAILED", "TIMEOUT"],
  SUCCESS: ["IDLE"],
  FAILED: ["IDLE"],
  CANCELLED: ["IDLE"],
  TIMEOUT: ["IDLE"],
});

export class StateMachine {
  constructor(initial = "IDLE") {
    if (!STATES.includes(initial)) throw new Error(`Unknown state: ${initial}`);
    this.state = initial;
    this.history = [initial];
  }

  can(to) {
    return (ALLOWED[this.state] || []).includes(to);
  }

  transition(to) {
    if (!STATES.includes(to)) throw new Error(`Unknown state: ${to}`);
    if (!this.can(to)) {
      throw new Error(`Illegal transition: ${this.state} -> ${to}`);
    }
    this.state = to;
    this.history.push(to);
    return to;
  }

  isTerminal() {
    return ["SUCCESS", "FAILED", "CANCELLED", "TIMEOUT"].includes(this.state);
  }
}
