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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const lib_common_1 = require("@gtm/lib.common");
const tsoa_1 = require("tsoa");
const express = require("express");
const lib_service_1 = require("@gtm/lib.service");
const tsoa_2 = require("tsoa");
const MessageRepository_1 = require("../repositories/MessageRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const firebase_1 = require("../firebase/firebase");
const firebase_notifi_1 = require("../firebase/firebase-notifi");
let MessageApiController = MessageApiController_1 = class MessageApiController extends lib_service_1.ApiController {
    /** Get Messages */
    getEntities(from, to, pageNumber, itemCount, sortName, sortType) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryToEntities = this.MessageRepository.buildQuery(from, to);
            let sort = { name: sortName, type: sortType || -1 };
            let messages = yield this.MessageRepository.findPagination(queryToEntities, pageNumber || 1, itemCount || 5, sort);
            if (messages) {
                let messageTotalItems = yield this.MessageRepository.find(queryToEntities);
                let users = yield this.UserRepository.find({ deleted: null });
                let messageDetailView = [];
                messages.map(mes => {
                    let user = users.find(u => u._id == mes.userId);
                    let toUser = users.find(u => u._id == mes.toUserId);
                    messageDetailView.push({
                        id: mes._id,
                        userId: mes.userId,
                        userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                        toUserId: mes.toUserId,
                        toUserName: toUser ? (toUser.phone ? toUser.name + ' - ' + toUser.phone : toUser.name) : '',
                        content: mes.content,
                        delivered: mes.delivered,
                        created: mes.created,
                        updated: mes.updated
                    });
                });
                let messageDetailViews = { messages: messageDetailView, totalItems: messageTotalItems.length };
                return Promise.resolve(messageDetailViews);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Get Message by Id */
    getEntity(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let Message = yield this.MessageRepository.findOneById(id);
            if (Message) {
                return Promise.resolve(Message);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Get List Messages For App*/
    getListMessageForApp(sortName, sortType, req) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.user;
            let sort = { name: sortName || 'created', type: sortType || 1 };
            let messages = yield this.MessageRepository.find({}, sort);
            if (messages) {
                let users = yield this.UserRepository.find({ deleted: null });
                let messageWithUser = [];
                messages.map(mes => {
                    let user = users.find(u => u._id == mes.userId);
                    let toUser = users.find(u => u._id == mes.toUserId);
                    if (mes.userId === userId || mes.toUserId === userId) {
                        var userOther;
                        if (mes.userId !== userId) {
                            userOther = mes.userId;
                        }
                        else {
                            userOther = mes.toUserId;
                        }
                        let infoUserOther = users.find(u => u._id == userOther);
                        if (messageWithUser.length === 0) {
                            messageWithUser.push({
                                userId: userOther,
                                userName: infoUserOther ? (infoUserOther.phone ? infoUserOther.name + ' - ' + infoUserOther.phone : infoUserOther.name) : '',
                                messageDetailView: [{
                                        id: mes._id,
                                        userId: mes.userId,
                                        userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                        toUserId: mes.toUserId,
                                        toUserName: toUser ? (toUser.phone ? toUser.name + ' - ' + toUser.phone : toUser.name) : '',
                                        content: mes.content,
                                        delivered: mes.delivered,
                                        created: mes.created,
                                        updated: mes.updated
                                    }]
                            });
                        }
                        else {
                            var findUser = messageWithUser.find(u => u.userId == userOther);
                            if (findUser == undefined) {
                                messageWithUser.push({
                                    userId: userOther,
                                    userName: infoUserOther ? (infoUserOther.phone ? infoUserOther.name + ' - ' + infoUserOther.phone : infoUserOther.name) : '',
                                    messageDetailView: [{
                                            id: mes._id,
                                            userId: mes.userId,
                                            userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                            toUserId: mes.toUserId,
                                            toUserName: toUser ? (toUser.phone ? toUser.name + ' - ' + toUser.phone : toUser.name) : '',
                                            content: mes.content,
                                            delivered: mes.delivered,
                                            created: mes.created,
                                            updated: mes.updated
                                        }]
                                });
                            }
                            else {
                                for (var i = 0; i < messageWithUser.length; i++) {
                                    if (userOther === messageWithUser[i].userId.toString()) {
                                        messageWithUser[i].messageDetailView.push({
                                            id: mes._id,
                                            userId: mes.userId,
                                            userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                            toUserId: mes.toUserId,
                                            toUserName: toUser ? (toUser.phone ? toUser.name + ' - ' + toUser.phone : toUser.name) : '',
                                            content: mes.content,
                                            delivered: mes.delivered,
                                            created: mes.created,
                                            updated: mes.updated
                                        });
                                        break;
                                    }
                                    else {
                                    }
                                }
                            }
                        }
                    }
                });
                let messageDetailViewsApp = { messages: messageWithUser };
                return Promise.resolve(messageDetailViewsApp);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Get List Messages with an user for App*/
    // @Tags('Message') @Security('jwt') @Get('/getforanuserapp')
    // public async getListMessageOfUser(
    //     @Query() toUserId: string,
    //     @Query() sortName?: string, @Query() sortType?: number,
    //     @Request() req?: express.Request,
    // ): Promise<MessageViewWithPaginationAnUserApp> {
    //     let userId = (<JwtToken>req.user).user;
    //     // let users = await this.UserRepository.find({ deleted: null });
    //     let currentUserDetails = await this.UserRepository.findOne({ _id: userId.toString(), deleted: null });
    //     if (!currentUserDetails) {
    //         return Promise.reject(`User ${userId} not found.`);
    //     }
    //     // let user = users.find(u => u._id == userId);
    //     let userHaveMessage = await this.UserRepository.findOne({ _id: toUserId, deleted: null });
    //     if (!userHaveMessage) {
    //         return Promise.reject(`User ${toUserId} not found.`);
    //     }
    //     // let userHaveMessage = users.find(u => u._id == toUserId);
    //     let queryToEntities = {
    //         $and: [
    //             { deleted: null },
    //             {
    //                 $or: [
    //                     { userId: userId },
    //                     { toUserId: userId }
    //                 ]
    //             },
    //         ],
    //     };
    //     let sort: Sort = { name: sortName, type: <SortType>sortType || -1 };
    //     let messages = await this.MessageRepository.find(queryToEntities, sort);
    //     if (messages) {
    //         let messageDetailView: MessageDetailView[] = messages.map((mes) => {
    //             if (mes.userId == toUserId) {
    //                 return <MessageDetailView>{
    //                     id: mes._id,
    //                     userId: toUserId,
    //                     userName: userHaveMessage ? (userHaveMessage.phone ? userHaveMessage.name + ' - ' + userHaveMessage.phone : currentUserDetails.name) : '',
    //                     toUserId: mes.toUserId,
    //                     toUserName: currentUserDetails ? (currentUserDetails.phone ? currentUserDetails.name + ' - ' + currentUserDetails.phone : currentUserDetails.name) : '',
    //                     content: mes.content,
    //                     delivered: mes.delivered,
    //                     created: mes.created,
    //                     updated: mes.updated
    //                 };
    //             } else {
    //                 return <MessageDetailView>{
    //                     id: mes._id,
    //                     userId: userId,
    //                     userName: currentUserDetails ? (currentUserDetails.phone ? currentUserDetails.name + ' - ' + currentUserDetails.phone : currentUserDetails.name) : '',
    //                     toUserId: toUserId,
    //                     toUserName: userHaveMessage ? (userHaveMessage.phone ? userHaveMessage.name + ' - ' + userHaveMessage.phone : userHaveMessage.name) : '',
    //                     content: mes.content,
    //                     delivered: mes.delivered,
    //                     created: mes.created,
    //                     updated: mes.updated
    //                 };
    //             }
    //         })
    //         let messageDetailViewsApp = <MessageViewWithPaginationAnUserApp>{ userId: toUserId, userName: userHaveMessage.name, messages: messageDetailView };
    //         return Promise.resolve(messageDetailViewsApp);
    //     }
    //     return Promise.reject(`Not found.`);
    // }
    /** Get List Messages with an user for App*/
    getListMessageOfUser(userIdToGetMessage, req, sortName, sortType) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.user;
            let sort = { name: sortName || 'created', type: sortType || 1 };
            let messages = yield this.MessageRepository.find({}, sort);
            let users = yield this.UserRepository.find({ deleted: null });
            let user = users.find(u => u._id == userId);
            let userHaveMessage = users.find(u => u._id == userIdToGetMessage);
            console.log(userHaveMessage);
            if (messages) {
                let messageDetailView = [];
                messages.map(mes => {
                    if (mes.userId === userId || mes.toUserId === userId) {
                        if (mes.userId === userIdToGetMessage) {
                            messageDetailView.push({
                                id: mes._id,
                                userId: userIdToGetMessage,
                                userName: userHaveMessage ? (userHaveMessage.phone ? userHaveMessage.name + ' - ' + userHaveMessage.phone : user.name) : '',
                                toUserId: mes.toUserId,
                                toUserName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                content: mes.content,
                                delivered: mes.delivered,
                                created: mes.created,
                                updated: mes.updated
                            });
                        }
                        else if (mes.toUserId === userIdToGetMessage) {
                            messageDetailView.push({
                                id: mes._id,
                                userId: userId,
                                userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                toUserId: userIdToGetMessage,
                                toUserName: userHaveMessage ? (userHaveMessage.phone ? userHaveMessage.name + ' - ' + userHaveMessage.phone : userHaveMessage.name) : '',
                                content: mes.content,
                                delivered: mes.delivered,
                                created: mes.created,
                                updated: mes.updated
                            });
                        }
                    }
                });
                let messageDetailViewsApp = { userId: userIdToGetMessage, userName: userHaveMessage.name, messages: messageDetailView };
                return Promise.resolve(messageDetailViewsApp);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Get List Messages for current user*/
    getListMessageForCurrentUser(sortName, sortType, req) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.user;
            let sort = { name: sortName || 'created', type: sortType || 1 };
            console.log('sort', sort);
            let queryToEntities = {
                $and: [
                    { deleted: null },
                    {
                        $or: [
                            { userId: userId },
                            { toUserId: userId }
                        ]
                    },
                ],
            };
            let messages = yield this.MessageRepository.find(queryToEntities, sort);
            let user = yield this.UserRepository.findOne({ _id: userId, deleted: null });
            if (messages) {
                let messageDetailViews = yield Promise.all(messages.map((mes) => __awaiter(this, void 0, void 0, function* () {
                    let peerUserDetails = yield this.UserRepository.findOne({ _id: mes.toUserId, deleted: null });
                    if (mes.userId == userId) {
                        return {
                            id: mes._id,
                            userId: userId,
                            userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                            toUserId: mes.toUserId,
                            toUserName: peerUserDetails ? (peerUserDetails.phone ? peerUserDetails.name + ' - ' + peerUserDetails.phone : peerUserDetails.name) : '',
                            content: mes.content,
                            delivered: mes.delivered,
                            created: mes.created,
                            updated: mes.updated
                        };
                    }
                    else if (mes.toUserId == userId) {
                        return {
                            id: mes._id,
                            userId: mes.toUserId,
                            userName: peerUserDetails ? (peerUserDetails.phone ? peerUserDetails.name + ' - ' + peerUserDetails.phone : peerUserDetails.name) : '',
                            toUserId: userId,
                            toUserName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                            content: mes.content,
                            delivered: mes.delivered,
                            created: mes.created,
                            updated: mes.updated
                        };
                    }
                })));
                return Promise.resolve(messageDetailViews);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Get Messages to notification*/
    getMessageToNotification(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.user;
            let messages = yield this.MessageRepository.find({});
            if (messages) {
                let users = yield this.UserRepository.find({ deleted: null });
                let messageDetailView = [];
                let messsageUpdate;
                messages.map(mes => {
                    let user = users.find(u => u._id == mes.userId);
                    let toUser = users.find(u => u._id == mes.toUserId);
                    if (mes.toUserId === userId) {
                        if (mes.announced === false) {
                            messageDetailView.push({
                                id: mes._id,
                                userId: mes.userId,
                                userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                toUserId: mes.toUserId,
                                toUserName: toUser ? (toUser.phone ? toUser.name + ' - ' + toUser.phone : toUser.name) : '',
                                content: mes.content,
                                delivered: mes.delivered,
                                created: mes.created,
                                updated: mes.updated
                            });
                        }
                    }
                });
                let messageDetailViews = { messages: messageDetailView, totalItems: messageDetailView.length };
                return Promise.resolve(messageDetailViews);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Get Messages to notification update*/
    getMessageToNotificationUpdate(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.user;
            let messages = yield this.MessageRepository.find({});
            if (messages) {
                let users = yield this.UserRepository.find({ deleted: null });
                let messageDetailView = [];
                let messsageUpdate;
                messages.map(mes => {
                    let user = users.find(u => u._id == mes.userId);
                    let toUser = users.find(u => u._id == mes.toUserId);
                    if (mes.toUserId === userId) {
                        if (mes.announced === false) {
                            messageDetailView.push({
                                id: mes._id,
                                userId: mes.userId,
                                userName: user ? (user.phone ? user.name + ' - ' + user.phone : user.name) : '',
                                toUserId: mes.toUserId,
                                toUserName: toUser ? (toUser.phone ? toUser.name + ' - ' + toUser.phone : toUser.name) : '',
                                content: mes.content,
                                delivered: mes.delivered,
                                created: mes.created,
                                updated: mes.updated
                            });
                            messsageUpdate = {
                                userId: mes.userId,
                                toUserId: mes.toUserId,
                                content: mes.content,
                                delivered: mes.delivered,
                                announced: true,
                            };
                            this.updateEntity(mes._id, messsageUpdate);
                        }
                    }
                });
                let messageDetailViews = { messages: messageDetailView, totalItems: messageDetailView.length };
                return Promise.resolve(messageDetailViews);
            }
            return Promise.reject(`Not found.`);
        });
    }
    /** Create New Message */
    createEntity(messageView, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let userId = req.user.user;
                if (messageView && !messageView.content) {
                    return Promise.reject('Can not send an empty message.');
                }
                let userInfo = yield this.UserRepository.findOneById(userId);
                if (!userInfo) {
                    return Promise.reject(`Could not found sender id ${userId}`);
                }
                let userInfoSendNoti = yield this.UserRepository.findOneById(messageView.toUserId);
                if (!userInfoSendNoti) {
                    return Promise.reject(`Could not found receiver id ${messageView.toUserId}`);
                }
                let message = yield this.MessageRepository.save({ userId: userId, toUserId: messageView.toUserId, content: messageView.content, delivered: messageView.delivered, announced: messageView.announced });
                if (message) {
                    let fcm = userInfoSendNoti.fcmToken ? userInfoSendNoti.fcmToken : "0";
                    if (fcm !== "0") {
                        // var messageNoti = {
                        //     data: {
                        //         title: "Tin nhắn: " + userInfo.name,
                        //         message: messageView.content,
                        //         screenID: "1",
                        //         userId: messageView.userId
                        //     },
                        //     token: fcm
                        // };
                        // await firebaseAdmin.messaging().send(messageNoti);
                        var messageNotification = {
                            data: {
                                title: "Bạn có tin nhắn mới !",
                                message: "Tin nhắn mới đến từ: " + userInfo.name,
                                screenID: "1",
                                userId: userId
                            },
                            token: fcm
                        };
                        firebase_1.firebaseAdmin.messaging().send(messageNotification).then(res => {
                            // console.log('Successfully sent message:', res);
                        }).catch((error) => {
                            console.log('Error sending message:', error);
                            return Promise.reject("Error notifi message");
                        });
                    }
                    return Promise.resolve(yield this.MessageRepository.findOneById(message._id));
                }
            }
            catch (error) {
                console.log(error);
                return Promise.reject(error);
            }
        });
    }
    /** Update Message */
    updateEntity(id, messageView) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = yield this.MessageRepository.findOneAndUpdate({ _id: id }, { userId: messageView.userId, toUserId: messageView.toUserId, content: messageView.content, delivered: messageView.delivered, announced: messageView.announced });
            if (message) {
                return Promise.resolve(yield this.MessageRepository.findOneById(message._id));
            }
            if (message instanceof Error) {
                return Promise.reject('Error');
            }
        });
    }
    /** Delete Message */
    deleteEntity(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = yield this.MessageRepository.findOneAndUpdate({ _id: id }, { s: Date.now() });
            if (message) {
                return Promise.resolve();
            }
            return Promise.reject(`Not found.`);
        });
    }
    testNotifiForMessage(title, message, fcm, userId, screenID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let notis = yield firebase_notifi_1.default.sendForMessage(title, message, fcm, userId, screenID);
                if (notis) {
                    return Promise.resolve("Gửi tin thành công: " + userId);
                }
                return Promise.reject("Gửi tin không thành công");
            }
            catch (ex) {
                console.log(ex);
                return Promise.reject("Lỗi: " + ex);
            }
        });
    }
    testNotifiForOpenScreen(title, message, fcm, matchId, borrowId, screenID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let notis = yield firebase_notifi_1.default.sendForScreen(title, message, fcm, screenID, matchId, borrowId);
                if (notis) {
                    return Promise.resolve("Gửi tin thành công");
                }
                return Promise.reject("Gửi tin không thành công");
            }
            catch (ex) {
                console.log(ex);
                return Promise.reject("Lỗi: " + ex);
            }
        });
    }
};
__decorate([
    inversify_1.inject(MessageRepository_1.MessageRepositoryTYPE),
    __metadata("design:type", Object)
], MessageApiController.prototype, "MessageRepository", void 0);
__decorate([
    inversify_1.inject(UserRepository_1.UserRepositoryTYPE),
    __metadata("design:type", Object)
], MessageApiController.prototype, "UserRepository", void 0);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get(),
    __param(0, tsoa_1.Query()), __param(1, tsoa_1.Query()),
    __param(2, tsoa_1.Query()), __param(3, tsoa_1.Query()),
    __param(4, tsoa_1.Query()), __param(5, tsoa_1.Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, String, Number]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getEntities", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get('/getbyid/{id}'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getEntity", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get('/getforapp'),
    __param(0, tsoa_1.Query()), __param(1, tsoa_1.Query()),
    __param(2, tsoa_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getListMessageForApp", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get('/getforanuserapp'),
    __param(0, tsoa_1.Query()),
    __param(1, tsoa_1.Request()),
    __param(2, tsoa_1.Query()), __param(3, tsoa_1.Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Number]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getListMessageOfUser", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get('/get-messages-for-current-user'),
    __param(0, tsoa_1.Query()), __param(1, tsoa_1.Query()),
    __param(2, tsoa_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getListMessageForCurrentUser", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get("get-message-to-notification"),
    __param(0, tsoa_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getMessageToNotification", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get("get-message-to-notification-update"),
    __param(0, tsoa_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "getMessageToNotificationUpdate", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Post(),
    __param(0, tsoa_1.Body()),
    __param(1, tsoa_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "createEntity", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Put('{id}'),
    __param(1, tsoa_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "updateEntity", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Delete('{id}'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "deleteEntity", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get('test-notifi-message'),
    __param(0, tsoa_1.Query()),
    __param(1, tsoa_1.Query()),
    __param(2, tsoa_1.Query()),
    __param(3, tsoa_1.Query()),
    __param(4, tsoa_1.Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "testNotifiForMessage", null);
__decorate([
    tsoa_2.Tags('Message'), tsoa_2.Security('jwt'), tsoa_1.Get('test-notifi-screen'),
    __param(0, tsoa_1.Query()),
    __param(1, tsoa_1.Query()),
    __param(2, tsoa_1.Query()),
    __param(3, tsoa_1.Query()),
    __param(4, tsoa_1.Query()),
    __param(5, tsoa_1.Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MessageApiController.prototype, "testNotifiForOpenScreen", null);
MessageApiController = MessageApiController_1 = __decorate([
    lib_common_1.injectableSingleton(MessageApiController_1),
    tsoa_1.Route('api/user/v1/Message')
], MessageApiController);
exports.MessageApiController = MessageApiController;
var MessageApiController_1;
