import { Router } from "express";
import { getCatalogController } from "../controllers/cocktail.controller";

const router = Router();

router.get("/catalog", getCatalogController);

export default router;
