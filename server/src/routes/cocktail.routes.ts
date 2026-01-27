import { Router } from "express";
import { getCatalog, getPublic, createCocktail, removeCocktail, getMyCocktails  } from "../controllers/cocktail.controller";
import { verifyJWT } from "../middleware/auth.middleware";


const router = Router();

router.get("/catalog", getCatalog);
router.get("/public-cocktails", getPublic);
router.post("/cocktails", verifyJWT, createCocktail);
router.delete("/cocktails/:id", verifyJWT, removeCocktail);
router.get("/cocktails", verifyJWT, getMyCocktails);
 

export default router;
