import express, { Router, Request, Response, NextFunction } from 'express';
import { createCarousel, createProject, deleteCarousel, deleteProject, getAllCarousels, getAllProjects, updateCarousel, updateProject } from '../controllers/base';

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





  router.get('/project', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllProjects(req, res);
    } catch (error) {
      next(error);
    }
  });
  
  
  router.post('/project', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await createProject(req, res);
    } catch (error) {
      next(error);
    }
  });
  
  router.put('/project', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await updateProject(req, res);
    } catch (error) {
      next(error);
    }
  });
  
  router.delete('/project', async (req: Request, res: Response, next: NextFunction) => {
      try {
        await deleteProject(req, res);
      } catch (error) {
        next(error);
      }
    });


export default router;