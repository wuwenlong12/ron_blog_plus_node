import express, { Router, Request, Response, NextFunction } from 'express';
import {  auth, checkSystemInitialized, login, mailValidation, register, updateUserProfile, userDetails } from '../controllers/user/user';


const router: Router = express.Router();


router.get('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await checkSystemInitialized(req, res);
  } catch (error) {
    next(error);
  }
});


router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await register(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await login(req, res);
  } catch (error) {
    next(error);
  }
});


router.get("/auth", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await auth(req, res);
  } catch (error) {
    next(error);
  }
});


router.get("/details", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userDetails(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch("/details", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await updateUserProfile(req, res);
  } catch (error) {
    next(error);
  }
});


router.get("/email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mailValidation(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;