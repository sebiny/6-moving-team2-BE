"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const customError_1 = require("../utils/customError");
const profile_repository_1 = __importDefault(require("../repositories/profile.repository"));
const auth_repository_1 = __importDefault(require("../repositories/auth.repository"));
// 고객 프로필 생성
function createCustomerProfile(authUserId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authUserId) {
            throw new customError_1.CustomError(400, "유저 ID가 유효하지 않습니다.");
        }
        // 유저 정보 조회
        const authUser = yield auth_repository_1.default.findById(authUserId);
        if (!authUser) {
            throw new customError_1.CustomError(404, "사용자를 찾을 수 없습니다.");
        }
        // 유저 타입이 CUSTOMER가 아닌 경우 생성 금지
        if (authUser.userType !== client_1.UserType.CUSTOMER) {
            throw new customError_1.CustomError(403, "고객이 아닌 사용자는 고객 프로필을 생성할 수 없습니다.");
        }
        // 이미 존재하는 경우 예외 처리
        const existing = yield profile_repository_1.default.findCustomerByAuthUserId(authUserId);
        if (existing)
            throw new customError_1.CustomError(409, "이미 고객 프로필이 존재합니다.");
        return yield profile_repository_1.default.createCustomerProfile(Object.assign(Object.assign({}, data), { authUser: { connect: { id: authUserId } } }));
    });
}
// 고객 프로필 수정 (authUser 정보도 함께 반환)
function updateCustomerProfile(authUserId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authUserId)
            throw new customError_1.CustomError(400, "유저 ID가 유효하지 않습니다.");
        // 1. 비밀번호 변경 요청 시 유효성 검사
        if (data.newPassword) {
            if (!data.currentPassword) {
                throw new customError_1.CustomError(400, "현재 비밀번호를 입력해주세요.");
            }
            if (data.newPassword !== data.passwordConfirmation) {
                throw new customError_1.CustomError(422, "새 비밀번호가 일치하지 않습니다.");
            }
            const authUser = yield auth_repository_1.default.findById(authUserId);
            if (!authUser) {
                throw new customError_1.CustomError(404, "사용자를 찾을 수 없습니다.");
            }
            if (!authUser.password) {
                // 소셜 로그인 유저 등 비밀번호가 없는 경우
                throw new customError_1.CustomError(400, "비밀번호가 설정되어 있지 않은 계정입니다.");
            }
            const isPasswordValid = yield bcrypt_1.default.compare(data.currentPassword, authUser.password);
            if (!isPasswordValid) {
                throw new customError_1.CustomError(401, "현재 비밀번호가 일치하지 않습니다.");
            }
        }
        // 2. authUser 업데이트
        const authUserUpdateData = {};
        if (data.name)
            authUserUpdateData.name = data.name;
        if (data.email)
            authUserUpdateData.email = data.email;
        if (data.phone)
            authUserUpdateData.phone = data.phone;
        if (data.newPassword)
            authUserUpdateData.password = yield bcrypt_1.default.hash(data.newPassword, 10);
        if (Object.keys(authUserUpdateData).length > 0) {
            yield auth_repository_1.default.updateAuthUser(authUserId, authUserUpdateData);
        }
        // 3. 고객 프로필 업데이트
        const profileUpdateData = {};
        if (data.profileImage !== undefined)
            profileUpdateData.profileImage = data.profileImage;
        if (data.moveType !== undefined)
            profileUpdateData.moveType = data.moveType;
        if (data.currentArea !== undefined)
            profileUpdateData.currentArea = data.currentArea;
        if (Object.keys(profileUpdateData).length === 0) {
            throw new customError_1.CustomError(400, "수정할 고객 프로필 정보가 없습니다.");
        }
        const updatedProfile = yield profile_repository_1.default.updateCustomerProfile(authUserId, profileUpdateData);
        // 4. 업데이트된 authUser 정보 재조회
        const updatedAuthUser = yield auth_repository_1.default.findById(authUserId);
        if (!updatedAuthUser)
            throw new customError_1.CustomError(404, "업데이트 후 사용자 정보를 찾을 수 없습니다.");
        // 5. 두 데이터를 합쳐서 반환
        return {
            authUser: updatedAuthUser
        };
    });
}
// 고객 프로필 조회
function getCustomerProfile(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const customer = yield profile_repository_1.default.getCustomerById(customerId);
        if (!customer)
            throw new customError_1.CustomError(404, "고객 프로필을 찾을 수 없습니다.");
        return customer;
    });
}
// 기사 프로필 생성
function createDriverProfile(authUserId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authUserId) {
            throw new customError_1.CustomError(400, "유저 ID가 유효하지 않습니다.");
        }
        // 유저 정보 조회
        const authUser = yield auth_repository_1.default.findById(authUserId);
        if (!authUser) {
            throw new customError_1.CustomError(404, "사용자를 찾을 수 없습니다.");
        }
        // 유저 타입이 DRIVER가 아닌 경우 생성 금지
        if (authUser.userType !== client_1.UserType.DRIVER) {
            throw new customError_1.CustomError(403, "기사가 아닌 사용자는 기사 프로필을 생성할 수 없습니다.");
        }
        // 이미 존재하는 경우 예외 처리
        const existing = yield profile_repository_1.default.findDriverByAuthUserId(authUserId);
        if (existing)
            throw new customError_1.CustomError(409, "이미 기사 프로필이 존재합니다.");
        return yield profile_repository_1.default.createDriverProfile({
            authUser: { connect: { id: authUserId } },
            profileImage: data.profileImage,
            nickname: data.nickname,
            career: data.career,
            shortIntro: data.shortIntro,
            detailIntro: data.detailIntro,
            moveType: data.moveType,
            serviceAreas: {
                create: data.serviceAreas
            }
        });
    });
}
// 기사 프로필 수정
function updateDriverProfile(authUserId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authUserId) {
            throw new customError_1.CustomError(400, "유저 ID가 유효하지 않습니다.");
        }
        if (data.career !== undefined) {
            data.career = Number(data.career);
        }
        const driver = yield profile_repository_1.default.findDriverByAuthUserId(authUserId);
        if (!driver)
            throw new customError_1.CustomError(404, "해당 기사를 찾을 수 없습니다.");
        if (data.serviceAreas) {
            yield profile_repository_1.default.deleteDriverServiceAreas(driver.id);
            const serviceAreasInput = data.serviceAreas.map((area) => ({
                driverId: driver.id,
                region: area.region,
                district: area.district
            }));
            yield profile_repository_1.default.createDriverServiceAreas(serviceAreasInput);
        }
        const { serviceAreas } = data, rest = __rest(data, ["serviceAreas"]);
        return yield profile_repository_1.default.updateDriverProfile(authUserId, rest);
    });
}
// 기사 프로필 조회
function getDriverProfile(driverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield profile_repository_1.default.getDriverById(driverId);
        if (!driver)
            throw new customError_1.CustomError(404, "기사 프로필을 찾을 수 없습니다.");
        return driver;
    });
}
exports.default = {
    createCustomerProfile,
    updateCustomerProfile,
    getCustomerProfile,
    createDriverProfile,
    updateDriverProfile,
    getDriverProfile
};
//# sourceMappingURL=profile.service.js.map