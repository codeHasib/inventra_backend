import { UserRole } from "../enums/userRole.enum";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        shopId?: string;
        role: UserRole;
        email: string;
      };
    }
  }
}
