import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./hakim/patients";
import casesRouter from "./hakim/cases";
import interviewRouter from "./hakim/interview";
import reportsRouter from "./hakim/reports";
import doctorRouter from "./hakim/doctor";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/patients", patientsRouter);
router.use("/cases", casesRouter);
router.use("/cases", interviewRouter);
router.use("/cases", reportsRouter);
router.use("/cases", doctorRouter);

export default router;
