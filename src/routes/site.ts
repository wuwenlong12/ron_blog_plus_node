import express, { Router, Request, Response, NextFunction } from 'express';
import { checkSubdomain, initSite, getSiteInfo, updateSiteInfo, getAllSites, getSystemStats } from '../controllers/site';
import { recordVisit, getVisitStats, getRealTimeVisits } from '../controllers/site/visit';

const router: Router = express.Router();

// 初始化站点
router.post('/init', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await initSite(req, res);
    } catch (error) {
        next(error);
    }
});

// 检查子域名
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await checkSubdomain(req, res);
    } catch (error) {
        next(error);
    }
});

// 获取站点信息
router.get('/info', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getSiteInfo(req, res);
    } catch (error) {
        next(error);
    }
});

// 更新站点信息
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await updateSiteInfo(req, res);
    } catch (error) {
        next(error);
    }
});

// 获取所有站点列表
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getAllSites(req, res);
    } catch (error) {
        next(error);
    }
});


// 获取系统统计数据
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getSystemStats(req, res);
    } catch (error) {
        next(error);
    }
});

// 记录访问
router.post('/visit', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await recordVisit(req, res);
    } catch (error) {
        next(error);
    }
});

// 获取访问统计
router.get('/visit/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getVisitStats(req, res);
    } catch (error) {
        next(error);
    }
});

// 获取实时访问数据
router.get('/visit/realtime', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getRealTimeVisits(req, res);
    } catch (error) {
        next(error);
    }
});

// 查找站点列表
// router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         await searchSites(req, res);
//     } catch (error) {
//         next(error);
//     }
// });

export default router;
