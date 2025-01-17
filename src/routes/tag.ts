import express, { Router, Request, Response, NextFunction } from 'express';
import { AddNewTag, DeleteTag, GetAllTags } from '../controllers/tag';

const router: Router = express.Router();


router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await AddNewTag(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetAllTags(req, res);
    } catch (error) {
        next(error);
    }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await DeleteTag(req, res);
    } catch (error) {
        next(error);
    }
});



export default router;