"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./config/passport"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const path_1 = __importDefault(require("path"));
const auth_router_1 = __importDefault(require("./routes/auth.router"));
const profile_router_1 = __importDefault(require("./routes/profile.router"));
const driver_router_1 = __importDefault(require("./routes/driver.router"));
const favorite_router_1 = __importDefault(require("./routes/favorite.router"));
const estimateReq_router_1 = __importDefault(require("./routes/estimateReq.router"));
const review_router_1 = __importDefault(require("./routes/review.router"));
const errorHandler_1 = require("./middlewares/errorHandler");
const notification_router_1 = __importDefault(require("./routes/notification.router"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "https://6-moving-team2-fe-sepia.vercel.app"],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use("/auth", auth_router_1.default);
app.use("/profile", profile_router_1.default);
app.use("/", estimateReq_router_1.default);
app.use("/", review_router_1.default);
app.use("/drivers", driver_router_1.default);
app.use("/favorite", favorite_router_1.default);
app.use("/notification", notification_router_1.default);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(yaml_1.default.parse(fs_1.default.readFileSync(path_1.default.join(path_1.default.resolve(), "openapi.yaml"), "utf-8"))));
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map