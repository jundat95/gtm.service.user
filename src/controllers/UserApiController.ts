import { inject } from 'inversify';
import { injectableSingleton } from "@gtm/lib.common";
import { Get, Post, Route, Body, Query, Header, Path, SuccessResponse, Controller, Request, Response, Delete, Put, } from 'tsoa';
import * as express from 'express';
import { ApiController, AttachmentView } from "@gtm/lib.service";
import config from './../config/AppConfig';
import { Security, Tags } from "tsoa";
import { JwtToken } from '@gtm/lib.service.auth';
import { UserRepository, UserRepositoryTYPE } from '../repositories/UserRepository';
import { MUserView, UserViewLite, UserViewFull, UserViewWithPagination, UserViewDetails, UserRoleView } from '../views/MUserView';
import { UserEntity, User, ProfileView, UserRole } from '../entities/UserEntity';
import { MProfileView } from '../views/MProfileView';
import { RoleType } from '../views/RoleView';
import { RoleRepositoryTYPE, RoleRepository } from '../repositories/RoleRepository';
import { MAttachmentView } from '../views/MAttachmentView';
import * as coreClient from '@scg/lib.client.core';

var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;

@injectableSingleton(UserApiController)
@Route('api/user/v1/user')
export class UserApiController extends ApiController {
    @inject(UserRepositoryTYPE) private UserRepository: UserRepository;
    @inject(RoleRepositoryTYPE) private RoleRepository: RoleRepository;

    /** Get all user lite */
    @Tags('User') @Security('jwt') @Get('/get-user-lite')
    public async getUserLite(): Promise<MUserView[]> {
        let userEntity = await this.UserRepository.find({});
        if (userEntity) {
            return Promise.resolve(this.UserRepository.buildClientUsers(userEntity));
        }
        return Promise.reject(`Not found.`);
    }

    /** Get user by Id */
    @Tags('User') @Security('jwt') @Get('/getById/{id}')
    public async getById(id: string): Promise<MUserView> {
        let userEntity = await this.UserRepository.findOneById(id);
        if (userEntity) {
            return Promise.resolve(this.UserRepository.buildClientUser(userEntity));
        }
        return Promise.reject(`Not found.`);
    }

    @Tags('User') @Security('jwt') @Get('/get-by-user-name')
    public async getUserByName(
        @Query() userName: string,
    ): Promise<MUserView[]> {
        let userEntity = await this.UserRepository.getByName(userName);
        if (userEntity) {
            return Promise.resolve(this.UserRepository.buildClientUsers(userEntity));
        }
        return Promise.reject(`Not found.`);
    }

    @Tags('User') @Security('jwt') @Get('/profile')
    public async getProfileCurrent(@Request() req: express.Request): Promise<ProfileView> {
        let userEntity = await this.UserRepository.findOneById((<JwtToken>req.user).user);
        if (userEntity) {
            return Promise.resolve(User.toProfileView(userEntity));
        }
        return Promise.reject(`Not found`);
    }

    @Tags('User') @Security('jwt') @Post('/profile')
    public async updateProfileCurrent(@Body() profileView: ProfileView, @Request() req?: express.Request): Promise<ProfileView> {
        const { roles, code, provider, active, ...updatingProfileView } = profileView;
        console.log(updatingProfileView);
        let oldUserEntity = await this.UserRepository.findOneAndUpdate({ _id: (<JwtToken>req.user).user }, { ...updatingProfileView, updated: Date.now() });
        if (!oldUserEntity) {
            return Promise.reject('Not found');
        }
        if (oldUserEntity instanceof Error) {
            return Promise.reject(<Error>oldUserEntity);
        }
        return Promise.resolve(User.toProfileView(await this.UserRepository.findOneById((<JwtToken>req.user).user)));
    }

    /** Update user with profiles */
    @Tags('User') @Security('jwt') @Post('/update-user-profiles')
    public async updateUserProfiles(
        @Body() profile: MProfileView,
        @Request() req: express.Request
    ): Promise<UserEntity> {

        let users = await this.UserRepository.findOne({ _id: (<JwtToken>req.user).user });
        if (!users) {
            return Promise.reject("User not exist");
        }

        const { job, bankRate, note, infos, name, identityCard, address, birthday, gender, localtion, phone, houseHolder } = profile;
        const { roles, code, provider, active, profiles } = users;
        const { google, facebook } = profiles;

        users.profiles = {
            google: google ? google : "",
            facebook: facebook ? facebook : "",
            default: {
                bankRate: bankRate ? bankRate : "",
                job: job ? job : "",
                infos: infos ? infos : "",
                note: note ? note : "",
                identityCard: identityCard ? identityCard : "",
                houseHolder: houseHolder
            }
        };

        name ? (users.name = name) : "";
        birthday ? (users.birthday = birthday) : 0;
        address ? (users.address = address) : "";
        gender ? (users.gender = gender) : "";
        localtion ? (users.location = localtion) : { x: 0, y: 0 };
        phone ? (users.phone = phone) : "";
        users.updated = new Date().getTime();

        let userSave = await this.UserRepository.update({ _id: (<JwtToken>req.user).user }, users);
        if (userSave) {
            return Promise.resolve(users);
        }

        return Promise.reject(`Not found.`);
    }

    /** Update user with profiles */
    @Tags('User') @Security('jwt') @Post('/update-avatar')
    public async updateAvatar(
        @Body() avatar: MAttachmentView,
        @Request() req: express.Request
    ): Promise<UserEntity> {

        try {
            let users = await this.UserRepository.findOne({ _id: (<JwtToken>req.user).user });
            if (!users) {
                return Promise.reject("User not exist");
            }


            console.log(avatar);

            // users.avatar = avatar;
            // users.updated = new Date().getTime();

            // let userSave = await this.UserRepository.findOneAndUpdate({ _id: (<JwtToken>req.user).user }, users);
            // if (userSave) {
            //     return Promise.resolve(userSave);
            // }

        } catch (e) {
            console.log(e);
            Promise.reject(`User not exist`);
        }

    }

    /** Get users with pagination */
    @Tags('User') @Security('jwt') @Get('/entities')
    public async getEntities(@Query() query?: string, @Query() pageNumber?: number, @Query() itemCount?: number)
        : Promise<UserViewWithPagination> {
        let queryToEntities = !!query ? {
            $and: [
                {
                    $or: [{
                        name: { $regex: query, $options: 'i' }
                    },
                    { email: { $regex: query, $options: 'i' } }
                        , { phone: { $regex: query, $options: 'i' } }]
                },
                {
                    deleted: null
                }
            ]
        } : { deleted: null };
        let users = await this.UserRepository.findPagination(queryToEntities, pageNumber || 1, itemCount || 5);
        if (users) {
            let userTotalItems = await this.UserRepository.find(queryToEntities);
            let userDetailViews: UserViewDetails[] = [];
            users.map(user => {
                userDetailViews.push(User.toDetailViews(user));
            })
            let userViews = <UserViewWithPagination>{ users: userDetailViews, totalItems: userTotalItems.length };
            return Promise.resolve(userViews);
        }
        return Promise.reject(`Not found.`);
    }

    /** Get user details by Id */
    @Tags('User') @Security('jwt') @Get('/details/{id}')
    public async getDetailViewById(id: string): Promise<UserViewDetails> {
        let userEntity = await this.UserRepository.findOneById(id);
        if (userEntity) {
            return Promise.resolve(User.toDetailViews(userEntity));
        }
        return Promise.reject(`Not found.`);
    }

    /** Create or update User Role */
    @Tags('User') @Security('jwt') @Post('/create-or-update-role')
    public async createOrUpdateUserRole(@Body() userRoleView: UserRoleView, @Request() req: express.Request): Promise<ProfileView> {
        const coreApi = new coreClient.LendApi(config.services.core, req.cookies.jwt);

        try {
            let user = await this.UserRepository.findOneById(userRoleView.userId);
            if (!user) {
                return Promise.reject("User does not exist");
            }

            if (!(userRoleView.roleType in RoleType)) {
                return Promise.reject(`Role type ${userRoleView.roleType} does not exist`);
            }

            let roleLookup = await this.RoleRepository.getRoleByType(RoleType[userRoleView.roleType]);
            let userUpdated;
            if (user.roles && user.roles.some(us => us.code == RoleType[userRoleView.roleType])) {
                // Update if this role is existed and updated in role entity
                user.roles.map(ur => {
                    if (ur.id == roleLookup.id) {
                        ur.id = roleLookup.id,
                            ur.code = roleLookup.code
                    }
                });
            }
            else { // Create new role
                user.roles.push({ id: roleLookup.id, code: roleLookup.code });
                if (userRoleView.roleType == RoleType.Lender) {
                    // Create lender object with status is New = 2
                    let lendObjectForUser = await coreApi.addLendForUser({ userId: userRoleView.userId, status: 2 });
                }
            }
            userUpdated = await this.UserRepository.findOneAndUpdate({ _id: userRoleView.userId }, user);
            if (userUpdated) {
                return Promise.resolve(User.toProfileView(await this.UserRepository.findOneById(userRoleView.userId)));
            }
        } catch (error) {
            return Promise.reject(error);
        }
    }
}