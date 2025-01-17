import express, { Router, Request, Response, NextFunction } from 'express';
import { AddDiary, GetAllDiaries, GetAllDiaryDates, GetDiaryById, UpdateDiary } from '../dao/diary';

const router: Router = express.Router();
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await AddDiary(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetAllDiaries(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/content', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetDiaryById(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/date', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await GetAllDiaryDates(req, res);
    } catch (error) {
        next(error);
    }
});

router.put('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UpdateDiary(req, res);
    } catch (error) {
        next(error);
    }
});






export default router;