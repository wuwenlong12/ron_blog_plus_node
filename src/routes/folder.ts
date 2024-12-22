import express, { Router, Request, Response, NextFunction } from 'express';
import { AddNewFolderOrArticle,    DeleteItem,    GetFoldersOrItemInfo,    UpdateFolderDesc,    UpdateFolderName, UpdateItemOrder,  } from '../dao/folder';

const router: Router = express.Router();



router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await AddNewFolderOrArticle(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetFoldersOrItemInfo(req, res);
    } catch (error) {
        next(error);
    }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await DeleteItem(req, res);
    } catch (error) {
        next(error);
    }
});

router.patch('/name', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateFolderName(req, res);
    } catch (error) {
        next(error);
    }
});

router.patch('/desc', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateFolderDesc(req, res);
    } catch (error) {
        next(error);
    }
});

router.patch('/order', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateItemOrder(req, res);
    } catch (error) {
        next(error);
    }
});

export default router;