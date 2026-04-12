import request from "supertest";
import app from "../app";
import {
  makeUser,
  register,
  login,
  registerAndLogin,
  promoteToAdmin,
  createOwnCocktail,
  resetDatabase,
} from "../utils/testHelpers";

describe("Reports tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test("user can create report for public cocktail", async () => {
    const author = makeUser("report_public_author");
    const reporter = makeUser("report_public_reporter");

    const authorToken = await registerAndLogin(author);
    const cocktailId = await createOwnCocktail(authorToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${authorToken}`);

    const admin = makeUser("report_public_admin");
    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    const reporterToken = await registerAndLogin(reporter);

    const publicRes = await request(app).get("/api/public");
    const publicId = publicRes.body[0].id;

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "public_cocktail",
        targetId: publicId,
        reason: "Spam",
        details: "Looks suspicious",
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.message).toBe("Report created");
    expect(reportRes.body.reportId).toBeTruthy();
  });

  test("user can create report for comment", async () => {
    const author = makeUser("report_comment_author");
    const reporter = makeUser("report_comment_reporter");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Bad comment",
      });

    expect(commentRes.status).toBe(201);

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Offensive",
        details: "This should be moderated",
      });

    expect(reportRes.status).toBe(201);
  });

  test("user cannot create duplicate open report for same target", async () => {
    const author = makeUser("report_dup_author");
    const reporter = makeUser("report_dup_reporter");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Duplicate report target",
      });

    expect(commentRes.status).toBe(201);

    const firstRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Spam",
      });

    expect(firstRes.status).toBe(201);

    const secondRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Spam",
      });

    expect(secondRes.status).toBe(409);
  });

  test("admin can get all reports", async () => {
    const author = makeUser("report_list_author");
    const reporter = makeUser("report_list_reporter");
    const admin = makeUser("report_list_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Reported comment",
      });

    await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Abuse",
      });

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const listRes = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].target_type).toBe("comment");
    expect(listRes.body[0].reporter_nickname).toBe(reporter.nickname);
  });

  test("admin can mark report as reviewed", async () => {
    const author = makeUser("report_review_author");
    const reporter = makeUser("report_review_reporter");
    const admin = makeUser("report_review_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Review me",
      });

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Abuse",
      });

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const reviewRes = await request(app)
      .patch(`/api/admin/reports/${reportRes.body.reportId}/review`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.message).toBe("Report marked as reviewed");

    const listRes = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body[0].status).toBe("reviewed");
  });

  test("non-admin cannot get reports", async () => {
    const user = makeUser("report_non_admin");
    const token = await registerAndLogin(user);

    const res = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("unauthorized user cannot create report", async () => {
    const res = await request(app).post("/api/reports").send({
      targetType: "comment",
      targetId: 1,
      reason: "Spam",
    });

    expect(res.status).toBe(401);
  });

  test("admin can hide public cocktail directly from report", async () => {
    const author = makeUser("hide_from_report_author");
    const reporter = makeUser("hide_from_report_reporter");
    const admin = makeUser("hide_from_report_admin");

    const authorToken = await registerAndLogin(author);
    const cocktailId = await createOwnCocktail(authorToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${authorToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const adminToken = adminLogin.body.token as string;

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reporterToken = await registerAndLogin(reporter);

    const publicRes = await request(app).get("/api/public");
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.length).toBe(1);

    const publicId = publicRes.body[0].id;

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "public_cocktail",
        targetId: publicId,
        reason: "Spam",
        details: "Should be removed",
      });

    expect(reportRes.status).toBe(201);

    const hideRes = await request(app)
      .patch(
        `/api/admin/reports/${reportRes.body.reportId}/hide-public-cocktail`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        adminReason: "Violates publication rules",
      });

    expect(hideRes.status).toBe(200);
    expect(hideRes.body.message).toBe("Public cocktail hidden from report");

    const publicAfterRes = await request(app).get("/api/public");
    expect(publicAfterRes.status).toBe(200);
    expect(publicAfterRes.body.length).toBe(0);

    const reportsRes = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body[0].status).toBe("reviewed");
  });

  test("cannot hide public cocktail from comment report", async () => {
    const author = makeUser("hide_wrong_report_author");
    const reporter = makeUser("hide_wrong_report_reporter");
    const admin = makeUser("hide_wrong_report_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Reported comment",
      });

    expect(commentRes.status).toBe(201);

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Offensive",
      });

    expect(reportRes.status).toBe(201);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const hideRes = await request(app)
      .patch(
        `/api/admin/reports/${reportRes.body.reportId}/hide-public-cocktail`,
      )
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({
        adminReason: "Wrong target type",
      });

    expect(hideRes.status).toBe(409);
  });

  test("admin can delete comment directly from report", async () => {
    const author = makeUser("delete_comment_report_author");
    const reporter = makeUser("delete_comment_report_reporter");
    const admin = makeUser("delete_comment_report_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment that should be removed",
      });

    expect(commentRes.status).toBe(201);

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Offensive",
        details: "Please remove it",
      });

    expect(reportRes.status).toBe(201);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const deleteRes = await request(app)
      .patch(`/api/admin/reports/${reportRes.body.reportId}/delete-comment`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({
        adminReason: "Comment violates community rules",
      });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Comment deleted from report");

    const commentsRes = await request(app).get("/api/comments/catalog/mojito");
    expect(commentsRes.status).toBe(200);
    expect(commentsRes.body.length).toBe(0);

    const reportsRes = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body[0].status).toBe("reviewed");
  });

  test("cannot delete comment from public cocktail report", async () => {
    const author = makeUser("wrong_delete_report_author");
    const reporter = makeUser("wrong_delete_report_reporter");
    const admin = makeUser("wrong_delete_report_admin");

    const authorToken = await registerAndLogin(author);
    const cocktailId = await createOwnCocktail(authorToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${authorToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`);

    const reporterToken = await registerAndLogin(reporter);

    const publicRes = await request(app).get("/api/public");
    const publicId = publicRes.body[0].id;

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "public_cocktail",
        targetId: publicId,
        reason: "Spam",
      });

    expect(reportRes.status).toBe(201);

    const deleteRes = await request(app)
      .patch(`/api/admin/reports/${reportRes.body.reportId}/delete-comment`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({
        adminReason: "Wrong type",
      });

    expect(deleteRes.status).toBe(409);
  });

  test("report stores admin_reason when public cocktail is hidden", async () => {
    const author = makeUser("report_admin_reason_public_author");
    const reporter = makeUser("report_admin_reason_public_reporter");
    const admin = makeUser("report_admin_reason_public_admin");

    const authorToken = await registerAndLogin(author);
    const cocktailId = await createOwnCocktail(authorToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${authorToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });
    const adminToken = adminLogin.body.token as string;

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reporterToken = await registerAndLogin(reporter);

    const publicRes = await request(app).get("/api/public");
    const publicId = publicRes.body[0].id;

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "public_cocktail",
        targetId: publicId,
        reason: "Spam",
        details: "Looks suspicious",
      });

    expect(reportRes.status).toBe(201);

    const hideRes = await request(app)
      .patch(
        `/api/admin/reports/${reportRes.body.reportId}/hide-public-cocktail`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        adminReason: "Violates publication rules",
      });

    expect(hideRes.status).toBe(200);

    const reportsRes = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body[0].status).toBe("reviewed");
    expect(reportsRes.body[0].admin_reason).toBe("Violates publication rules");
  });

  test("report stores admin_reason when comment is deleted from report", async () => {
    const author = makeUser("report_admin_reason_comment_author");
    const reporter = makeUser("report_admin_reason_comment_reporter");
    const admin = makeUser("report_admin_reason_comment_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment to delete from report",
      });

    expect(commentRes.status).toBe(201);

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Offensive",
        details: "Please review",
      });

    expect(reportRes.status).toBe(201);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });
    const adminToken = adminLogin.body.token as string;

    const deleteRes = await request(app)
      .patch(`/api/admin/reports/${reportRes.body.reportId}/delete-comment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        adminReason: "Comment violates community rules",
      });

    expect(deleteRes.status).toBe(200);

    const reportsRes = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body[0].status).toBe("reviewed");
    expect(reportsRes.body[0].admin_reason).toBe(
      "Comment violates community rules",
    );
  });

  test("author gets notification when public cocktail is hidden from report", async () => {
    const author = makeUser("notif_report_public_author");
    const reporter = makeUser("notif_report_public_reporter");
    const admin = makeUser("notif_report_public_admin");

    const authorToken = await registerAndLogin(author);
    const cocktailId = await createOwnCocktail(authorToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${authorToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });
    const adminToken = adminLogin.body.token as string;

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reporterToken = await registerAndLogin(reporter);

    const publicRes = await request(app).get("/api/public");
    const publicId = publicRes.body[0].id;

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "public_cocktail",
        targetId: publicId,
        reason: "Spam",
      });

    expect(reportRes.status).toBe(201);

    const hideRes = await request(app)
      .patch(
        `/api/admin/reports/${reportRes.body.reportId}/hide-public-cocktail`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        adminReason: "Removed after complaint review",
      });

    expect(hideRes.status).toBe(200);

    const notificationsRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(notificationsRes.status).toBe(200);
    expect(notificationsRes.body.length).toBeGreaterThan(0);
    expect(notificationsRes.body[0].type).toBe(
      "report_public_cocktail_removed",
    );
    expect(notificationsRes.body[0].admin_reason).toBe(
      "Removed after complaint review",
    );
    expect(notificationsRes.body[0].recipe_type).toBe("public");
  });

  test("author gets notification when comment is deleted from report", async () => {
    const author = makeUser("notif_report_comment_author");
    const reporter = makeUser("notif_report_comment_reporter");
    const admin = makeUser("notif_report_comment_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment that will be removed by report",
      });

    expect(commentRes.status).toBe(201);

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Abuse",
      });

    expect(reportRes.status).toBe(201);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });
    const adminToken = adminLogin.body.token as string;

    const deleteRes = await request(app)
      .patch(`/api/admin/reports/${reportRes.body.reportId}/delete-comment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        adminReason: "Deleted after admin review",
      });

    expect(deleteRes.status).toBe(200);

    const notificationsRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(notificationsRes.status).toBe(200);
    expect(notificationsRes.body.length).toBeGreaterThan(0);
    expect(notificationsRes.body[0].type).toBe("report_comment_deleted");
    expect(notificationsRes.body[0].admin_reason).toBe(
      "Deleted after admin review",
    );
    expect(notificationsRes.body[0].comment_id).toBeNull();
  });

  test("cannot hide public cocktail from report without admin reason", async () => {
    const author = makeUser("report_public_no_reason_author");
    const reporter = makeUser("report_public_no_reason_reporter");
    const admin = makeUser("report_public_no_reason_admin");

    const authorToken = await registerAndLogin(author);
    const cocktailId = await createOwnCocktail(authorToken);

    await request(app)
      .post(`/api/${cocktailId}/publish`)
      .set("Authorization", `Bearer ${authorToken}`);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });
    const adminToken = adminLogin.body.token as string;

    await request(app)
      .post(`/api/admin/moderation/${cocktailId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reporterToken = await registerAndLogin(reporter);

    const publicRes = await request(app).get("/api/public");
    const publicId = publicRes.body[0].id;

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "public_cocktail",
        targetId: publicId,
        reason: "Spam",
      });

    expect(reportRes.status).toBe(201);

    const hideRes = await request(app)
      .patch(
        `/api/admin/reports/${reportRes.body.reportId}/hide-public-cocktail`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        adminReason: "",
      });

    expect(hideRes.status).toBe(400);
  });

  test("cannot delete comment from report without admin reason", async () => {
    const author = makeUser("report_comment_no_reason_author");
    const reporter = makeUser("report_comment_no_reason_reporter");
    const admin = makeUser("report_comment_no_reason_admin");

    const authorToken = await registerAndLogin(author);
    const reporterToken = await registerAndLogin(reporter);

    const commentRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({
        cocktailId: "mojito",
        cocktailType: "catalog",
        content: "Comment requiring admin reason",
      });

    expect(commentRes.status).toBe(201);

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "comment",
        targetId: commentRes.body.commentId,
        reason: "Offensive",
      });

    expect(reportRes.status).toBe(201);

    await register(admin);
    await promoteToAdmin(admin.email);

    const adminLogin = await login({
      email: admin.email,
      password: admin.password,
    });

    const deleteRes = await request(app)
      .patch(`/api/admin/reports/${reportRes.body.reportId}/delete-comment`)
      .set("Authorization", `Bearer ${adminLogin.body.token}`)
      .send({
        adminReason: "",
      });

    expect(deleteRes.status).toBe(400);
  });
});
