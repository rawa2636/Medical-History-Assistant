import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./hakim/patients";
import casesRouter from "./hakim/cases";
import interviewRouter from "./hakim/interview";
import reportsRouter from "./hakim/reports";
import doctorRouter from "./hakim/doctor";
import registrationRouter from "./hakim/registration";
import authRouter from "./hakim/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/patients", patientsRouter);
router.use("/cases", casesRouter);
router.use("/cases", interviewRouter);
router.use("/cases", reportsRouter);
router.use("/cases", doctorRouter);
router.use("/registration", registrationRouter);

export default router;
