import { Router, Request, Response } from "express";
import * as projectsRoute from "./projects/route";
import * as documentsRoute from "./documents/route";

const router: Router = Router();

// Projects routes
router.get("/projects", async (req: Request, res: Response) => {
  try {
    const mockRequest: any = {
      ...req,
    };

    const response = await projectsRoute.GET(mockRequest);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/projects/:id", async (req: Request, res: Response) => {
  try {
    const mockRequest: any = {
      ...req,
    };

    const response = await projectsRoute.GET_BY_ID(
      mockRequest,
      req.params.id as string,
    );
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post("/projects", async (req: Request, res: Response) => {
  try {
    const mockRequest: any = {
      ...req,
      json: async () => req.body,
    };

    const response = await projectsRoute.POST(mockRequest);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.put("/projects/:id", async (req: Request, res: Response) => {
  try {
    const mockRequest: any = {
      ...req,
      json: async () => req.body,
    };

    const response = await projectsRoute.PUT(
      mockRequest,
      req.params.id as string,
    );
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.delete("/projects/:id", async (req: Request, res: Response) => {
  try {
    const mockRequest: any = {
      ...req,
    };

    const response = await projectsRoute.DELETE(
      mockRequest,
      req.params.id as string,
    );
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Documents routes
router.get("/documents/:id", async (req: Request, res: Response) => {
  try {
    const mockRequest: any = {
      ...req,
    };

    const response = await documentsRoute.GET(
      mockRequest,
      req.params.id as string,
    );
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post(
  "/projects/:projectId/documents",
  async (req: Request, res: Response) => {
    try {
      const mockRequest: any = {
        ...req,
        json: async () => req.body,
      };

      const response = await documentsRoute.POST(
        mockRequest,
        req.params.projectId as string,
      );
      const data = await response.json();

      return res.status(response.status).json(data);
    } catch (error: any) {
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

export default router;
