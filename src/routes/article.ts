import express, { Router, Request, Response, NextFunction } from 'express';
import { GetAllArticlesInfo, GetArticleInfo, GetPaginatedArticles, UpdateArticleTags, SearchArticlesByTags, SearchArticlesByTitle } from '../controllers/article';
import { UpdateArticleContent } from '../controllers/article';

const router: Router = express.Router();
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetAllArticlesInfo(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetPaginatedArticles(req, res);
    } catch (error) {
        next(error);
    }
});

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

router.post('/tags', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateArticleTags(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/search/tag', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await SearchArticlesByTags(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/search/title', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await SearchArticlesByTitle(req, res);
    } catch (error) {
        next(error);
    }
});

export default router;