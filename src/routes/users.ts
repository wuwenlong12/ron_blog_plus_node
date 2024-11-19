import express, { Router, Request, Response, NextFunction } from 'express';
import { register, repeat, login, userDetial } from '../dao/user/user';

const router: Router = express.Router();

/* POST user registration. */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await register(req, res);
  } catch (error) {
    next(error);
  }
});

/* POST check for repeated user. */
router.post('/repeat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, data } = req.body;
    await repeat(data, type, res);
  } catch (error) {
    next(error);
  }
});

/* POST user login. */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(123);
    await login(req, res);
  } catch (error) {
    next(error);
  }
});


router.get('/detail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userDetial(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;