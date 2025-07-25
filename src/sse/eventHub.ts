import { EventEmitter } from "events";

// 앱 전체에서 단 하나만 사용될 이벤트 허브 인스턴스
const eventHub = new EventEmitter();

export default eventHub;
