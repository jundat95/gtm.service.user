"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepEqual = require('deep-equal');
const inversify_1 = require("inversify");
const lib_common_1 = require("@gtm/lib.common");
const lib_service_1 = require("@gtm/lib.service");
const lib_service_2 = require("@gtm/lib.service");
const AccountEnity_1 = require("../entities/AccountEnity");
exports.AccountRepositoryTYPE = Symbol("AccountRepository");
let AccountRepositoryImpl = class AccountRepositoryImpl extends lib_service_1.RepositoryImpl {
    constructor(mongoclient) {
        super(mongoclient, "account", AccountEnity_1.AccountSchema);
    }
};
AccountRepositoryImpl = __decorate([
    lib_common_1.injectableSingleton(exports.AccountRepositoryTYPE),
    __param(0, inversify_1.inject(lib_service_2.DefaultMongoClientTYPE)),
    __metadata("design:paramtypes", [Object])
], AccountRepositoryImpl);
exports.AccountRepositoryImpl = AccountRepositoryImpl;
