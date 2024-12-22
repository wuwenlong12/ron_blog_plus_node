import express, { Router, Request, Response, NextFunction } from 'express';
import { GetArticleInfo } from '../dao/article';
import { UpdateArticleContent } from '../dao/article';

const router: Router = express.Router();


router.get('/content', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetArticleInfo(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/content', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateArticleContent(req, res);
    } catch (error) {
        next(error);
    }
});



export default router;