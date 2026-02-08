import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import * as c from "../controllers/cocktail.controller";

const router = Router();

router.get("/catalog", c.getCatalog);
router.get("/public", c.getPublic);

router.use(authMiddleware);

router.get("/my", c.getMyCocktails);
router.post("/", c.createCocktail);
router.put("/:id", c.editCocktail);
router.delete("/:id", c.removeCocktail);
router.post("/:id/publish", c.publishUserCocktailHandler);
router.delete(
  "/public/:id",
  authMiddleware,
  c.removePublicCocktail
);

export default router;
