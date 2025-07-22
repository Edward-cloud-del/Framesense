declare const _default: AuthService;
export default _default;
declare class AuthService {
    createUser(email: any, password: any, name: any): Promise<{
        user: any;
        token: string;
    }>;
    loginUser(email: any, password: any): Promise<{
        user: any;
        token: string;
    }>;
    verifyToken(token: any): Promise<any>;
    getUserByEmail(email: any): Promise<any>;
    updateUser(email: any, updates: any): Promise<any>;
    readUsers(): Promise<any>;
    writeUsers(userData: any): Promise<void>;
    sanitizeUser(user: any): any;
}
