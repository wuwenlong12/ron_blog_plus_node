import express, { Router, Request, Response, NextFunction } from 'express';
import { AddNewFolderOrArticle,    DeleteItem,    GetFoldersAndArticles,    UpdateFolderInfo, UpdateItemOrder,  } from '../dao/artical';

const router: Router = express.Router();



router.post('/directory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await AddNewFolderOrArticle(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/directory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetFoldersAndArticles(req, res);
    } catch (error) {
        next(error);
    }
});

router.delete('/directory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await DeleteItem(req, res);
    } catch (error) {
        next(error);
    }
});

router.patch('/directory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateFolderInfo(req, res);
    } catch (error) {
        next(error);
    }
});

router.patch('/directory/order', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateItemOrder(req, res);
    } catch (error) {
        next(error);
    }
});

export default router;