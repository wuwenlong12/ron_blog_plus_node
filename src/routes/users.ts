import express, { Router, Request, Response, NextFunction } from 'express';
import {  auth, checkSystemInitialized, init, login } from '../controllers/user/user';

const router: Router = express.Router();

// /* POST user registration. */
// router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     await register(req, res);
//   } catch (error) {
//     next(error);
//   }
// });

/* POST check for repeated user. */
router.get('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await checkSystemInitialized(req, res);
  } catch (error) {
    next(error);
  }
});

/* POST check for repeated user. */
router.post('/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await init(req, res);
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

// /* POST user login. */
// router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     console.log(123);
//     await login(req, res);
//   } catch (error) {
//     next(error);
//   }
// });


// router.get('/detail', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     await userDetial(req, res);
//   } catch (error) {
//     next(error);
//   }
// });

export default router;