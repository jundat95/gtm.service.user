import { inject } from 'inversify';
import { TYPE, controller, httpGet, httpPost, requestParam, queryParam, requestBody } from 'inversify-express-utils';
import * as express from 'express';

import config from './../config/AppConfig';
import { WebController } from "@gtm/lib.service";
import { UserRepository, UserRepositoryTYPE } from '../repositories/UserRepository';
import { JwtToken } from '@gtm/lib.service.auth';
import { Binary } from 'bson';

@controller('/web/user')
export class UserWebController extends WebController {
    @inject(UserRepositoryTYPE) private UserRepository: UserRepository;

    /**
     * Get current user Avatar
     */
    @httpGet('/avatar')
    public getAvatar(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        if (!(<JwtToken>req.user).user) {
            res.sendStatus(401);
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            this.UserRepository.findOneById((<JwtToken>req.user).user).then(userEntity => {
                if (!userEntity.avatar) {
                    reject('Avatar is not available');
                } else {
                    res.contentType(userEntity.avatar.media);
                    res.end(userEntity.avatar.data.buffer, 'binary', resolve);
                }
            }).catch(e => reject(e));
        });
    }

    /**
     * Get Avatar for other user
     */
    @httpGet('/avatar/:id')
    public getAvatarFor(@requestParam('id') userId: string, req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        if (!(<JwtToken>req.user).user) {
            res.sendStatus(401);
            return Promise.resolve();
        }
        if (!userId) {
            return Promise.reject('Invalid user Id');
        }
        if ((<JwtToken>req.user).user === userId) {
            res.sendStatus(401);
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            this.UserRepository.findOneById(userId).then(userEntity => {
                if (!userEntity.avatar) {
                    reject('Avatar is not available');
                } else {
                    res.contentType(userEntity.avatar.media);
                    res.end(userEntity.avatar.data.buffer, 'binary', resolve);
                }
            }).catch(e => reject(e));
        });
    }
}