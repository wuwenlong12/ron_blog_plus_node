import express, { Router, Request, Response, NextFunction } from 'express';
import { createCarousel, deleteCarousel, getAllCarousels, updateCarousel } from '../controllers/base';

const router: Router = express.Router();


router.get('/carousel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getAllCarousels(req, res);
  } catch (error) {
    next(error);
  }
});


router.post('/carousel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await createCarousel(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/carousel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await updateCarousel(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/carousel', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteCarousel(req, res);
    } catch (error) {
      next(error);
    }
  });


export default router;