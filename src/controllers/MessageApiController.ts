import { inject } from 'inversify';
import { injectableSingleton } from "@gtm/lib.common";
import { Get, Post, Route, Body, Query, Header, Path, SuccessResponse, Controller, Request, Response, Delete, Put } from 'tsoa';
import * as express from 'express';
import { ApiController, Sort, SortType } from "@gtm/lib.service";
import config from './../config/AppConfig';
import { Security, Tags } from "tsoa";
import { JwtToken } from '@gtm/lib.service.auth';
import { MessageRepository, MessageRepositoryTYPE } from '../repositories/MessageRepository';
import { MessageView, MessageViewWithPagination, MessageDetailView, MessageViewWithPaginationApp, MessageDetailViewApp, MessageViewWithPaginationAnUserApp } from '../views/MessageView';
import { MessageEntity } from '../entities/MessageEntity';
import { UserRepositoryTYPE, UserRepository } from '../repositories/UserRepository';
import { firebaseAdmin } from "../firebase/firebase";
import { MFCMView } from '../views/MProfileView';
import FireBaseNotifi from '../firebase/firebase-notifi';

@injectableSingleton(MessageApiController)
@Route('api/user/v1/Message')
export class MessageApiController extends ApiController {
    @inject(MessageRepositoryTYPE) private MessageRepository: MessageRepository;
    @inject(UserRepositoryTYPE) private UserRepository: UserRepository;

    /** Get Messages */
    @Tags('Message') @Security('jwt') @Get()
    public async getEntities(
        @Query() from?: string, @Query() to?: string,
        @Query() pageNumber?: number, @Query() itemCount?: number,
        @Query() sortName?: string, @Query() sortType?: number,
    )
        : Promise<MessageViewWithPagination> {
        let queryToEntities = this.MessageRepository.buildQuery(from, to);
        let sort: Sort = { name: sortName, type: <SortType>sortType || -1 };
        let messages = await this.MessageRepository.findPagination(queryToEntities, pageNumber || 1, itemCount || 5, sort);
        if (messages) {
            let messageTotalItems = await this.MessageRepository.find(queryToEntities);
            let users = await this.UserRepository.find({ deleted: null });
            let messageDetailView: MessageDetailView[] = [];
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
            })
            let messageDetailViews = <MessageViewWithPagination>{ messages: messageDetailView, totalItems: messageTotalItems.length };
            return Promise.resolve(messageDetailViews);
        }
        return Promise.reject(`Not found.`);
    }


    /** Get Message by Id */
    @Tags('Message') @Security('jwt') @Get('/getbyid/{id}')
    public async getEntity(id: string): Promise<MessageEntity> {
        let Message = await this.MessageRepository.findOneById(id);
        if (Message) {
            return Promise.resolve(Message);
        }
        return Promise.reject(`Not found.`);
    }

    /** Get List Messages For App*/
    @Tags('Message') @Security('jwt') @Get('/getforapp')
    public async getListMessageForApp(
        @Query() sortName?: string, @Query() sortType?: number,
        @Request() req?: express.Request,
    )
        : Promise<MessageViewWithPaginationApp> {
        let userId = (<JwtToken>req.user).user;
        let sort: Sort = { name: sortName || 'created', type: <SortType>sortType || 1 };
        let messages = await this.MessageRepository.find({}, sort);

        if (messages) {
            let users = await this.UserRepository.find({ deleted: null });

            let messageWithUser: MessageDetailViewApp[] = [];
            messages.map(mes => {
                let user = users.find(u => u._id == mes.userId);
                let toUser = users.find(u => u._id == mes.toUserId);
                if (mes.userId === userId || mes.toUserId === userId) {
                    var userOther: string;

                    if (mes.userId !== userId) {
                        userOther = mes.userId
                    } else {
                        userOther = mes.toUserId
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
                        })
                    } else {

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
                            })
                        } else {
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
                                    })
                                    break;
                                } else {
                                }
                            }
                        }
                    }
                }
            })

            let messageDetailViewsApp = <MessageViewWithPaginationApp>{ messages: messageWithUser };
            return Promise.resolve(messageDetailViewsApp);
        }
        return Promise.reject(`Not found.`);
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
    @Tags('Message') @Security('jwt') @Get('/getforanuserapp')
    public async getListMessageOfUser(
        @Query() userIdToGetMessage: string,
        @Request() req?: express.Request,
        @Query() sortName?: string, @Query() sortType?: number,
    )
        : Promise<MessageViewWithPaginationAnUserApp> {
        let userId = (<JwtToken>req.user).user;
        let sort: Sort = { name: sortName || 'created', type: <SortType>sortType || 1 };   
        let messages = await this.MessageRepository.find({}, sort);     
        let users = await this.UserRepository.find({ deleted: null });
        let user = users.find(u => u._id == userId);
        let userHaveMessage = users.find(u => u._id == userIdToGetMessage);
        console.log(userHaveMessage);
        if (messages) {
            let messageDetailView: MessageDetailView[] = [];

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
                        })
                    } else if (mes.toUserId === userIdToGetMessage) {
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
                        })
                    }
                }
            })

            let messageDetailViewsApp = <MessageViewWithPaginationAnUserApp>{ userId: userIdToGetMessage, userName: userHaveMessage.name, messages: messageDetailView };
            return Promise.resolve(messageDetailViewsApp);
        }
        return Promise.reject(`Not found.`);
    }

    /** Get List Messages for current user*/
    @Tags('Message') @Security('jwt') @Get('/get-messages-for-current-user')
    public async getListMessageForCurrentUser(
        @Query() sortName?: string, @Query() sortType?: number,
        @Request() req?: express.Request,
    )
        : Promise<MessageDetailView[]> {
        let userId = (<JwtToken>req.user).user;
        let sort: Sort = { name: sortName || 'created', type: <SortType>sortType || 1 };
        console.log('sort', sort)
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

        let messages = await this.MessageRepository.find(queryToEntities, sort);
        let user = await this.UserRepository.findOne({ _id: userId, deleted: null });
        if (messages) {
            let messageDetailViews: MessageDetailView[] = await Promise.all(messages.map(async mes => {
                let peerUserDetails = await this.UserRepository.findOne({ _id: mes.toUserId, deleted: null });
                if (mes.userId == userId) {
                    return <MessageDetailView>{
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
                } else if (mes.toUserId == userId) {
                    return <MessageDetailView>{
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
            }));
            return Promise.resolve(messageDetailViews);
        }
        return Promise.reject(`Not found.`);
    }

    /** Get Messages to notification*/
    @Tags('Message') @Security('jwt') @Get("get-message-to-notification")
    public async getMessageToNotification(
        @Request() req?: express.Request,
    ): Promise<MessageViewWithPagination> {
        let userId = (<JwtToken>req.user).user;
        let messages = await this.MessageRepository.find({});
        if (messages) {
            let users = await this.UserRepository.find({ deleted: null });
            let messageDetailView: MessageDetailView[] = [];
            let messsageUpdate: MessageView;
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
            })
            let messageDetailViews = <MessageViewWithPagination>{ messages: messageDetailView, totalItems: messageDetailView.length };
            return Promise.resolve(messageDetailViews);
        }
        return Promise.reject(`Not found.`);
    }

    /** Get Messages to notification update*/
    @Tags('Message') @Security('jwt') @Get("get-message-to-notification-update")
    public async getMessageToNotificationUpdate(
        @Request() req?: express.Request,
    ): Promise<MessageViewWithPagination> {
        let userId = (<JwtToken>req.user).user;
        let messages = await this.MessageRepository.find({});
        if (messages) {
            let users = await this.UserRepository.find({ deleted: null });
            let messageDetailView: MessageDetailView[] = [];
            let messsageUpdate: MessageView;
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
                        }
                        this.updateEntity(mes._id, messsageUpdate);
                    }
                }
            })
            let messageDetailViews = <MessageViewWithPagination>{ messages: messageDetailView, totalItems: messageDetailView.length };
            return Promise.resolve(messageDetailViews);
        }
        return Promise.reject(`Not found.`);
    }

    /** Create New Message */
    @Tags('Message') @Security('jwt') @Post()
    public async createEntity(
        @Body() messageView: MessageView,
        @Request() req: express.Request,
    ): Promise<MessageEntity> {
        try {
            let userId = (<JwtToken>req.user).user;
            if (messageView && !messageView.content) {
                return Promise.reject('Can not send an empty message.');
            }

            let userInfo = await this.UserRepository.findOneById(userId);

            if (!userInfo) {
                return Promise.reject(`Could not found sender id ${userId}`);
            }

            let userInfoSendNoti = await this.UserRepository.findOneById(messageView.toUserId);

            if (!userInfoSendNoti) {
                return Promise.reject(`Could not found receiver id ${messageView.toUserId}`);
            }

            let message = await this.MessageRepository.save(<MessageEntity>{ userId: userId, toUserId: messageView.toUserId, content: messageView.content, delivered: messageView.delivered, announced: messageView.announced });

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
        
                    firebaseAdmin.messaging().send(messageNotification).then(res => {
                        // console.log('Successfully sent message:', res);
                    }).catch((error) => {
                        console.log('Error sending message:', error);
                        return Promise.reject("Error notifi message");
                            
                    });


                }
                return Promise.resolve(await this.MessageRepository.findOneById(message._id));
            }
        } catch (error) {
            console.log(error);
            return Promise.reject(error);
        }
    }

    /** Update Message */
    @Tags('Message') @Security('jwt') @Put('{id}')
    public async updateEntity(id: string, @Body() messageView: MessageView): Promise<MessageEntity> {
        let message = await this.MessageRepository.findOneAndUpdate({ _id: id }, <MessageEntity>{ userId: messageView.userId, toUserId: messageView.toUserId, content: messageView.content, delivered: messageView.delivered, announced: messageView.announced });
        if (message) {
            return Promise.resolve(await this.MessageRepository.findOneById(message._id));
        }
        if (message instanceof Error) {
            return Promise.reject('Error');
        }
    }

    /** Delete Message */
    @Tags('Message') @Security('jwt') @Delete('{id}')
    public async deleteEntity(id: string): Promise<void> {
        let message = await this.MessageRepository.findOneAndUpdate({ _id: id }, { s: Date.now() });
        if (message) {
            return Promise.resolve();
        }
        return Promise.reject(`Not found.`);
    }

    @Tags('Message') @Security('jwt') @Get('test-notifi-message')
    public async testNotifiForMessage(
        @Query() title: string, 
        @Query() message: string, 
        @Query() fcm: string, 
        @Query() userId: string, 
        @Query() screenID: string): Promise<string> {
            
            try {
               let notis = await FireBaseNotifi.sendForMessage(title, message, fcm, userId, screenID);
               if (notis) {
                   return Promise.resolve("Gửi tin thành công: " + userId);
               } 
               return Promise.reject("Gửi tin không thành công");

            } catch (ex){
                console.log(ex);
                return Promise.reject("Lỗi: " + ex);
            }
    }

    @Tags('Message') @Security('jwt') @Get('test-notifi-screen')
    public async testNotifiForOpenScreen(
        @Query() title: string, 
        @Query() message: string, 
        @Query() fcm: string, 
        @Query() matchId: string, 
        @Query() borrowId: string, 
        @Query() screenID: string): Promise<string> {
            
            try {
               let notis = await FireBaseNotifi.sendForScreen(title, message, fcm, screenID, matchId, borrowId);
               if (notis) {
                   return Promise.resolve("Gửi tin thành công");
               } 
               return Promise.reject("Gửi tin không thành công");

            } catch (ex){
                console.log(ex);
                return Promise.reject("Lỗi: " + ex);
            }
    }
}